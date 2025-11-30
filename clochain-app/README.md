# CloChain App (PWA)

QR 스캔 → Wallet DID 인증 → NFT 등록/양도를 담당하는 Vite 기반 PWA입니다. thirdweb 지갑이 직접 트랜잭션을 서명해야 한다는 CloChain v2 명세를 충실히 따르며, 아래 사용자 시나리오가 그대로 구현 대상입니다.

## 핵심 플로우

1. **thirdweb 로그인**  
   `/scan` 또는 `/wallet` 진입 시 ThirdWeb로 로그인하고, 앱은 `walletAddress`와 `did:ethr:<wallet>`를 확보합니다.

2. **QR 스캔 & 검증**  
   `/scan`에서 의류 QR을 스캔 → short_token을 추출 → `GET /verify?q=<short>`로 payload와 서버 서명을 확인합니다.

3. **메타데이터 발급**  
   payload가 유효하면 `POST /nft/metadata`에 `{ short_token }`을 보냅니다. 서버가 Pinata에 metadata JSON을 올리고 `cid`를 돌려줍니다.

4. **지갑으로 직접 mint**  
   앱이 thirdweb 지갑 트랜잭션 창을 띄우고, 사용자가 `mint(to = myWallet, tokenURI = ipfs://cid)` 트랜잭션을 직접 서명/전송합니다. **이 단계가 끝나야 체인에 NFT가 실제로 생성됩니다.**

5. **`/nft/record` 호출**  
   트랜잭션이 확정되어 tokenId가 나오면, 앱이 즉시 `POST /nft/record`에 `{ tokenId, walletAddress, cid, payload }`를 전송해 CloChain 서버 DB에 등록 기록을 남깁니다. 이 과정을 거쳐야 `/verify`·`/wallet`에서 정식 소유 NFT로 인식됩니다.

6. **소유권 이전**  
   `/transfer/:tokenId`에서 `transferFrom(myWallet, to, tokenId)`를 thirdweb 지갑으로 서명하고, 끝난 뒤 `/nft/record-transfer`에 `{ tokenId, from, to, txHash }`를 제출해 DB에 이력을 추가합니다.

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

- **“버튼만 누르면 NFT가 생성되나요?”**  
  아니요. 지갑 트랜잭션 팝업에서 사용자가 서명/전송해야만 mint가 실행됩니다.

- **“mint 없이 `/nft/record`만 호출하면 어떻게 되나요?”**  
  서버가 DID와 payload를 검사하지만, 온체인 tokenId가 없으면 진짜 NFT가 존재하지 않습니다. 반드시 3–5 단계 전체를 수행해야 합니다.
