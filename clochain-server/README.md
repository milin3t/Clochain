# CloChain Server (FastAPI)

FastAPI 백엔드로 CloChain v2의 DID 로그인, QR 발급/검증, Pinata 메타데이터 생성, NFT/Transfer 기록을 담당합니다. 지갑(Web3Auth)이 트랜잭션을 직접 서명하고, 서버는 서명/검증/DB 기록만 수행한다는 AGENTS 명세를 그대로 구현합니다.

## 주요 기능

- `POST /auth/wallet/request` + `POST /auth/wallet/verify`로 wallet DID 세션 발급
- `POST /issue`에서 QR payload 조립 + HMAC 서명 + short_token 생성
- `GET /verify`로 short_token 복원 및 payload 진위 확인
- `POST /nft/metadata` 호출 시 Pinata(IPFS) 업로드 → CID 반환
- `POST /nft/record` / `POST /nft/record-transfer`로 온체인 mint/transfer 결과를 DB에 기록
- Polygon 상의 `ownerOf` 조회, metadata 제공 등 모든 정보 조회 API의 근간

## 환경 변수

`.env` 파일 예시:

```
APP_NAME=CloChain Server v2
DATABASE_URL=sqlite:///./clochain.db
JWT_SECRET=...
HMAC_SECRET=...
CORS_ORIGINS=https://clochain-app.vercel.app
PINATA_API_KEY=...
PINATA_API_SECRET=...   # 또는 PINATA_SECRET
PINATA_JWT=...          # 선택, Bearer 사용
```

- `PINATA_JWT`가 있으면 Bearer 헤더로 업로드를 수행하고, 없으면 API Key/Secret 헤더를 사용합니다.
- `PINATA_JWT`도 없고 키가 기본값이면 서버는 자동으로 mock CID 를 생성해 개발 편의성을 유지합니다.

### 온체인 mint 설정

```
RPC_URL=https://polygon-amoy.g.alchemy.com/v2/<api-key>
SERVER_PRIVATE_KEY=0x....
SERVER_WALLET_ADDRESS=0x....
CONTRACT_ADDRESS=0x....
```

서버는 `scripts/ethers-runner.mjs`를 통해 Node/ethers v6로 `mintAuthenticityToken`을 실행합니다.  
따라서 FastAPI 디렉터리에서도 npm 의존성을 설치해야 하며(Railway 등 배포 환경 포함), 다음 명령을 추가로 실행하세요:

```bash
cd clochain-server
npm install
```

Railway의 빌드 설정에는 `pip install -r requirements.txt` 뒤에 `npm install`을 추가 커맨드로 넣어 두면 됩니다.

## 로컬 실행

```bash
cd clochain-server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
uvicorn app.main:app --reload
```

기본 DB는 `sqlite:///./clochain.db`입니다. Railway 등에서는 PostgreSQL URL을 넣어주세요.

## 엔드포인트 개요

| 구분 | 메서드/경로 | 설명 |
| --- | --- | --- |
| 인증 | `POST /auth/wallet/request` | walletAddress로 nonce 발급 |
| 인증 | `POST /auth/wallet/verify` | nonce 서명 검증 후 JWT 반환 |
| QR | `POST /issue` | brand/product/purchaseAt/ownerWallet 입력 → short_token + QR 이미지 |
| 검증 | `GET /verify` | short_token 복원 + signature 검증 (tokenId 조회 시 체인 ownerOf로 더블 체크) |
| 메타데이터 | `POST /nft/metadata` | payload 검증 후 Pinata 업로드 → `{ cid, metadata }` |
| NFT 기록 | `POST /nft/record` | 온체인 mint 후 tokenId+payload를 기록 |
| 양도 기록 | `POST /nft/record-transfer` | transferFrom 실행 후 체인 결과를 기록 |

모든 DID는 `did:ethr:<wallet>` 형식을 강제하며, `/nft/record` 단계에서 payload와 walletAddress가 반드시 일치해야 합니다.

## 개발 팁

- QR payload는 HMAC-SHA256 서명과 short_token(base64url)을 사용하므로, 동일한 입력만 동일한 토큰을 생성합니다.
- Pinata 업로드 실패 시 502 에러를 반환하므로, App 레이어에서 재시도/에러 처리를 해 주세요.
- `app/services/nft_service.py`는 payload → short_token 역추적 검증을 수행하므로, 서버 측에 조작된 payload를 전송해도 등록되지 않습니다.
