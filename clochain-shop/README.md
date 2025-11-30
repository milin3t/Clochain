# CloChain Shop (React/Vite)

브랜드 스태프가 QR을 발급하고 누구나 short_token을 검증할 수 있는 Vite 기반 웹앱입니다. 로그인 없이 owner wallet 정보를 입력받아 `/issue` API를 호출하고, `/shop/verify`에서는 short_token을 서버에 전달해 진위를 확인합니다.

## 화면 구성

- `/shop/:brand/issue`  
  - 브랜드/상품 ID/구매일/최초 소유자 지갑 주소(= DID) 입력 폼  
  - 제출 시 FastAPI `POST /issue` 호출 → payload + signature + `qr_base64` 수신 → 화면에서 QR 미리보기 제공  
  - short_token은 고객에게 전달하여 CloChain App에서 스캔하게 함

- `/shop/verify`  
  - URL 쿼리에 포함된 `q` 또는 직접 입력한 short_token으로 `GET /verify` 호출  
  - payload(brand, productId, purchaseAt, did)와 서버 signature 검증 결과를 UI에 표시  
  - 온체인 tokenId가 있으면 owner wallet도 표시 (App이 mint 후 `/nft/record`를 완료한 경우)

## 개발/빌드

```bash
pnpm install
pnpm dev    # http://localhost:5173
pnpm build
```

`.env` 예시:

```
VITE_CLOCHAIN_API_URL=<FastAPI base URL>
```

Shop은 지갑 트랜잭션을 생성하지 않으며, Web3Auth와의 직접 연동도 없습니다.

## Tech Stack

- React 19 + Vite + TypeScript + TailwindCSS
- React Router로 `/shop/:brand/issue`, `/shop/verify` 라우팅
- Axios로 CloChain Server API 호출

## 운영 팁

- QR payload에는 `did:ethr:<ownerWallet>`만 포함되므로, 최초 고객 지갑 주소를 반드시 정확하게 입력해야 합니다.
- `/issue`는 서버 서명(HMAC)과 short_token을 동시에 반환하므로, QR 이미지 외에 short_token 텍스트를 별도로 고객 메일/전표에 저장해 두면 분실 시 재다운로드가 가능합니다.
- `/shop/verify`는 완전 공개 페이지이므로, 브랜드별 안내 문구나 고객 지원 연결을 이 화면에서 함께 노출하면 좋습니다.
