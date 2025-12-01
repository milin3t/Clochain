# CloChain App (PWA)

QR 기반 정품 등록·인증·양도를 담당하는 React 19 + Vite PWA입니다. Thirdweb In-App Wallet로 DID(지갑 주소)를 발급받고, FastAPI 서버와 통신해 QR short_token을 검증한 뒤 Polygon Amoy 체인에 NFT를 보관합니다. mint는 서버 지갑이 대행하지만, 사용자 지갑이 항상 서명하는 로그인·transfer 흐름을 유지합니다.

---

## 주요 기능

| 화면 | 설명 |
| --- | --- |
| `/login` | Thirdweb In-App Wallet(이메일) 로그인 및 DID 세션 확보 |
| `/scan` | `@yudiel/react-qr-scanner`로 QR을 스캔해 short_token 추출, `/nft/register` 호출 |
| `/wardrobe` | `/nft/me`에서 가져온 보유 NFT 목록을 카드 형태로 렌더링 |
| `/wardrobe/:tokenId` | 특정 NFT 메타데이터를 조회해 상세 정보 표시 |
| `/transfer/:tokenId` | Thirdweb signer로 `transferFrom` 직접 서명, `/nft/record-transfer` 호출 |
| NotFound | 존재하지 않는 경로 접근 시 로그인/옷장으로 돌아가는 404 페이지 |

UX 측면에서는 모바일 친화 레이아웃, 상태(toast) 안내, QR 스캔 즉시 처리 등을 제공해 실제 오프라인 매장에서 바로 사용할 수 있도록 구성했습니다.

---

## 기술 스택

- **React 19 + Vite + TypeScript**
- **React Router v7**: 라우팅 및 보호 경로(RequireAuth)
- **Tailwind CSS**: 반응형 UI
- **Thirdweb SDK**: In-App Wallet 로그인, Polygon Amoy 트랜잭션(`transferFrom`) 서명
- **Axios**: FastAPI 서버(`/auth`, `/nft`) REST 호출
- **@yudiel/react-qr-scanner**: 브라우저 QR 인식
- **ESLint / TypeScript 설정**: React 19, SWC 기반 빌드 대응

---

## 구조 요약

```
src/
 ├─ api/           # axios 래퍼 (auth, nft 등)
 ├─ context/       # AuthContext → thirdweb 로그인 & JWT 세션
 ├─ pages/         # Scan, Wardrobe, Transfer 등 주요 화면
 ├─ lib/           # NFT transfer 액션(thirdweb contract call)
 ├─ router/        # useRoutes 기반 라우팅 + RequireAuth
 └─ utils/         # 주소 포매팅 등 공용 유틸
```

- **AuthContext**: thirdweb SDK로 이메일 로그인 → `requestWalletNonce`/`verifyWalletSignature` 호출해 FastAPI JWT를 얻습니다. 세션/지갑 주소는 `localStorage` + `sessionStorage`에 저장해 새로고침에도 유지합니다.
- **API 계층**: `VITE_API_BASE_URL`을 기준으로 `/nft/*`, `/auth/*`를 호출합니다. 모든 민감 요청은 `Authorization: Bearer <JWT>` 헤더로 보호됩니다.
- **On-chain 연동**: mint는 서버가 담당하지만 클라이언트는 `transferAuthenticityNFT`에서 직접 thirdweb client를 사용해 `transferFrom`을 전송합니다.

---

## 블록체인 연동 흐름 (고정 규칙)

1. **로그인 & DID 발급**
   - thirdweb In-App Wallet으로 이메일 로그인.
   - FastAPI `/auth/wallet/request`가 nonce 발급 → 지갑 서명 → `/auth/wallet/verify`에서 JWT(`access_token`) 발급.
   - 이 토큰을 Bearer로 사용하지 않으면 모든 `/nft/*` 호출이 거절된다.
2. **QR 스캔 → 등록**
   - `/scan`에서 short_token 추출.
   - `ensureSession()`으로 JWT 확보 후 `/nft/register` POST.
   - 서버는 short_token 검증 → Pinata metadata 생성 → 서버 owner key로 `mintAuthenticityToken(to = userWallet)` → tokenId/cid/txHash를 반환한다.
   - mint 실패 시 앱도 실패로 간주한다(서버 지갑이 chain에 올리지 않기 때문).
3. **워드로브 표시**
   - `/nft/me`는 DB 목록 + Polygon Amoy `ownerOf/tokenURI`를 병합해 지갑 보유 NFT를 재구성한다. 단, 온체인에 실제로 존재하지 않으면 목록에 표시되지 않는다.
4. **소유권 이전**
   - `/transfer/:tokenId`에서 thirdweb signer가 직접 `transferFrom`을 전송한다. 가스비가 부족하면 chain 에러를 그대로 노출하며 UI는 “가스비 잔고가 부족합니다” 토스트를 띄운다.
   - 체인에서 성공한 뒤 `/nft/record-transfer`를 호출해 DB 기록을 업데이트한다.
5. **로그인 상태**
   - `localStorage`와 thirdweb 상태를 조합해 `/wardrobe` 접근 시 로그인 여부를 판단한다. 새 탭이나 브라우저 재시작 시에는 다시 thirdweb 연결을 요구하며, 로그인 페이지로 리다이렉트될 수 있다.

---

위 흐름은 CloChain App이 준수해야 할 고정 규칙이다. FastAPI/thirdweb 관련 설정은 레포 공통 문서를 따르며, CloChain은 web2+web3 하이브리드 구조이므로 mint·transfer를 제외한 모든 검증 기록은 서버 DB(PostgreSQL)에 남는다.

---

## 추가 참고 사항

- CloChain App은 CloChain Shop/FastAPI/Contracts와 함께 동작하는 모노레포 일부입니다. API 규약을 임의로 변경할 수 없으며, mint는 항상 서버 지갑이 처리합니다.
- 워드로브 목록은 온체인 정보까지 병합하므로 DB가 초기화되어도 지갑이 실제로 보유한 NFT는 계속 확인할 수 있습니다.
- Transfer 시 사용자 지갑에 Polygon Amoy MATIC 잔고가 없으면 트랜잭션이 실패하므로, UI에서 잔고 부족 토스트를 노출합니다.
- QR 스캔 모듈은 HTTPS 환경(또는 localhost)에서만 카메라 접근이 허용되므로 배포 시 Vercel Custom Domain/HTTPS를 필수로 사용하세요.

이 README는 CloChain App 단독으로 프로젝트를 이해할 수 있도록 전체 플로우·환경 변수·개발 방법을 모두 포함합니다. more details? 👉 FastAPI/Shop/Contracts README 참고.
