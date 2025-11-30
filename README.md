# CloChain v2 (thirdweb + Wallet DID)

CloChain은 의류 QR을 기반으로 사용자가 직접 NFT 정품 인증을 등록하고, thirdweb 지갑(DID)으로 소유권을 증명·양도·검증하는 시스템입니다. 이 리포지토리 모노레포로, Shop/App/Server/Contracts 네 영역을 한 번에 관리합니다.

## Monorepo 구조

```
root/
├─ clochain-shop/              # React(Vite) QR 발급/검증 UI (Vercel)
├─ clochain-app/               # React(Vite, PWA) 스캔/등록/지갑/양도 (Vercel)
├─ clochain-server/            # FastAPI 백엔드 (Railway 등)
└─ clochain-contracts/         # Hardhat ERC-721 (Polygon Amoy)
```

각 디렉터리의 README에 세부 개발 방법이 정리되어 있습니다.

## End-to-End 플로우

1. **thirdweb 로그인**  
   App에서 이메일/소셜 로그인을 하면 ThirdWeb이 wallet/private key를 생성하고 DID(`did:ethr:<wallet>`)를 획득합니다. 서버 `POST /auth/wallet/*`를 거쳐 JWT 세션을 발급받습니다.

2. **QR 발급 (Shop)**  
   브랜드 스태프가 `/shop/:brand/issue`에서 brand/productId/purchaseAt/ownerWallet을 입력 → 서버 `POST /issue` 호출 → payload + signature + short_token + QR 이미지 확보. 이 short_token이 고객에게 전달됩니다.

3. **QR 스캔 & NFT 등록 (App)**  
   고객이 QR을 스캔하여 short_token을 얻고 `/verify`로 payload 진위를 확인 → `POST /nft/metadata`로 Pinata에 metadata 업로드 → CID를 받으면 thirdweb 지갑이 `mint(to, ipfs://cid)`를 직접 서명/전송 → 체인에서 tokenId가 생성되면 바로 `POST /nft/record`로 서버 DB에 등록.

4. **소유권 검증**  
   누구든 `/shop/verify` 혹은 서버 `GET /verify`로 short_token을 검증하고, 서버는 payload + signature 확인 후 Polygon `ownerOf(tokenId)`를 조회해 현재 소유자와 metadata 정보를 보여줍니다.

5. **소유권 이전**  
   App의 `/transfer/:tokenId`에서 thirdweb 지갑이 `transferFrom`을 직접 서명 → 완료 후 `POST /nft/record-transfer`로 DB에 이력 저장. 최초 발급자 정보(`firstOwnerWallet`)는 nfts 테이블과 metadata에 영구 보존됩니다.

## Tech Stack

- **Frontend (Shop/App)**  
  - React 19 + Vite + TypeScript + TailwindCSS  
  - React Router, Axios, QR 스캐너(`@yudiel/react-qr-scanner`)  
  - thirdweb + Thirdweb SDK로 Polygon Amoy 트랜잭션 직접 서명
- **Backend**  
  - FastAPI + SQLAlchemy + SQLite/PostgreSQL  
  - JWT 기반 세션, HMAC-SHA256 short_token 서명, Pinata API(또는 JWT)로 metadata 업로드
- **Smart Contract**  
  - Solidity 0.8.24, Hardhat, OpenZeppelin ERC721URIStorage  
  - Optional server-signature enforcement, payload hash 재사용 방지

## 빠른 시작

1. **서버**: `cd clochain-server && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload`
2. **Shop/App**: 각 디렉터리에서 `npm install && npm dev`
3. **Contracts**: `cd contracts && npm install && npm run compile`

필수 환경 변수:

- `clochain-server`: `JWT_SECRET`, `HMAC_SECRET`, `DATABASE_URL`, `PINATA_API_KEY`/`PINATA_API_SECRET` 또는 `PINATA_JWT`
- `clochain-app`: `VITE_CLOCHAIN_API_URL`, `VITE_TW_CLIENT_ID`
- `clochain-shop`: `VITE_CLOCHAIN_API_URL`, `VITE_TW_CLIENT_ID`
- `contracts`: `POLYGON_AMOY_RPC_URL`, `PRIVATE_KEY`, `POLYGONSCAN_API_KEY`(선택)

## 규칙 (요약)

- 모든 DID는 `did:ethr:<wallet>` 형태만 사용
- NFT mint/transfer는 **항상 사용자 지갑(thirdweb)** 이 서명
- 서버는 QR/HMAC/metadata/DB 기록만 담당하며, short_token을 `/shop/verify?q=<token>` URL 형태로만 노출
- 명세 외 API/구조를 추가하지 않으며, 모든 변경 내역은 `CHANGELOG.md`에 기록
