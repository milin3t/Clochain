# CloChain App (PWA)

QR 스캔 → Wallet DID 인증 → NFT 등록/양도를 담당하는 Vite 기반 PWA입니다. thirdweb in-app wallet로 로그인해 DID를 만들고, 서버 `/nft/register`에 short_token을 보내면 서버 지갑이 mint를 대행합니다. 사용자는 트랜잭션 내역을 확인하고, 소유권 이전 시에만 직접 `transferFrom`을 서명합니다.

## 핵심 플로우

1. **thirdweb 로그인**  
   `/scan` 또는 `/wallet` 진입 시 ThirdWeb로 로그인하고, 앱은 `walletAddress`와 `did:ethr:<wallet>`를 확보합니다.

2. **QR 스캔 & `/nft/register`**  
   `/scan`에서 QR을 읽어 short_token을 추출 → `ensureSession()`으로 JWT 확보 → `POST /nft/register` 호출. 서버는 short_token을 검증하고 Pinata에 metadata를 업로드한 뒤 서버 지갑으로 `mintAuthenticityToken(to = userWallet)`을 실행합니다. 응답에는 `tokenId`, `cid`, `metadata`, `txHash`가 포함됩니다.

3. **지갑 / 워드로브 갱신**  
   `/nft/register` 응답을 받은 뒤 앱은 로컬 워드로브를 새로고침해 소유 NFT를 보여줍니다. 별도 `/nft/record` 호출이 필요 없으며, 서버가 자동으로 DB에 기록합니다.

4. **소유권 이전**  
   `/transfer/:tokenId`에서 thirdweb signer로 `transferFrom(myWallet, to, tokenId)`을 직접 서명/전송합니다. 완료 후 `/nft/record-transfer` API에 `{ tokenId, fromWallet, toWallet, txHash }`를 보내 DB에 이력을 남깁니다.

## 개발/빌드

```bash
npm install
npm dev    # http://localhost:5173
npm build
```

환경 변수(.env):

```
VITE_CLOCHAIN_API_URL=<FastAPI base URL>
VITE_TW_CLIENT_ID=<thirdweb client id>
VITE_CONTRACT_ADDRESS=<CloChainAuthenticity contract on Polygon Amoy>
```

필요 시 Polygon Amoy RPC, Pinata CID 뷰어 등의 추가 값을 주입하면 됩니다.

## Tech Stack

- React 19 + Vite + TypeScript + TailwindCSS
- React Router, `@yudiel/react-qr-scanner`로 QR 스캔 UI 구성
- Axios로 FastAPI 호출, Thirdweb SDK(thirdweb 연결 포함)로 Polygon Amoy 트랜잭션 서명

## 자주 묻는 질문

- **“이제 사용자 지갑이 mint를 안 해도 되나요?”**  
  `/nft/register`는 서버 지갑이 mint를 대신 수행합니다. 사용자는 QR 스캔 → API 호출만 하면 되고, 체인 내역은 tx hash로 확인하면 됩니다. 단, 소유권 이전은 여전히 사용자가 직접 서명해야 합니다.

- **“세션 없이 `/nft/register`만 호출하면 되나요?”**  
  JWT가 없으면 서버가 DID를 확인할 수 없어 401/403을 돌려줍니다. 반드시 앱에서 thirdweb 세션을 갱신한 뒤 호출해야 합니다.
