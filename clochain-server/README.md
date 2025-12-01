# CloChain Server (FastAPI)

FastAPI 백엔드로 CloChain v2의 DID 로그인, QR 발급/검증, Pinata 메타데이터 생성, NFT/Transfer 기록을 담당합니다. QR short_token 검증 후 서버 지갑으로 mint를 실행하고, 클라이언트는 transfer 시에만 직접 서명합니다.

## 주요 기능

- wallet DID 세션 발급: `POST /auth/wallet/request`, `POST /auth/wallet/verify`
- QR 발급/검증: `POST /issue`, `GET /verify`
- `/nft/register`에서 short_token → metadata → 서버 지갑 mint → tokenId/txHash 응답
- `/nft/record-transfer`와 `/nft/me`로 체인 소유권 변동을 DB와 연동
- Polygon Amoy `ownerOf` 조회, metadata 전달

## 환경 변수

`.env` 파일 예시(`.env.example` 참고, 현재는 DB 연결만 포함됨):

```
DATABASE_URL=postgresql+psycopg://<user>:<pass>@<host>:<port>/<db>
```

추가 환경 변수(JWT, Pinata, RPC 등)는 아래 섹션을 참고해 개별적으로 설정하세요.

### 온체인 mint 설정

```
RPC_URL=https://polygon-amoy.g.alchemy.com/v2/<api-key>
SERVER_PRIVATE_KEY=0x...
SERVER_WALLET_ADDRESS=0x...
CONTRACT_ADDRESS=0x...
```

서버는 web3.py를 사용해 EOA로 직접 `mintAuthenticityToken` 트랜잭션을 전송합니다.

## 로컬 실행

```bash
cd clochain-server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

기본 개발 환경은 SQLite(`sqlite:///./clochain.db`)로 동작하지만, 운영에서는 Railway PostgreSQL 커넥션을 `DATABASE_URL`에 입력하세요. 서버는 `postgres://` 또는 `postgresql://` 형식을 자동으로 `postgresql+psycopg://`로 변환하므로 Railway에서 받은 문자열을 그대로 넣으면 됩니다.

## 엔드포인트 개요

| 구분 | 메서드/경로 | 설명 |
| --- | --- | --- |
| 인증 | `POST /auth/wallet/request` | walletAddress로 nonce 발급 |
| 인증 | `POST /auth/wallet/verify` | nonce 서명 검증 후 JWT 반환 |
| QR | `POST /issue` | brand/product/purchaseAt/ownerWallet 입력 → short_token + QR 이미지 |
| 검증 | `GET /verify` | short_token 복원 + signature 검증 (필요 시 ownerOf 조회) |
| NFT 등록 | `POST /nft/register` | short_token 검증 → Pinata 업로드 → 서버 지갑으로 mint → tokenId/txHash 응답 |
| 소유권 이력 | `POST /nft/record-transfer` | 사용자가 서명한 transfer 결과를 기록 |
| 보관함 | `GET /nft/me` | 로그인한 wallet의 NFT 목록 |

모든 DID는 `did:ethr:<wallet>` 형식을 강제하며, `/nft/register`는 payload DID와 세션 wallet이 일치해야 진행됩니다.

## 개발 팁

- QR payload는 HMAC-SHA256 서명과 short_token(base64url)을 사용하므로, 동일한 입력만 동일한 토큰을 생성합니다.
- Pinata 업로드 실패 시 502 에러를 반환하므로, App 레이어에서 재시도/에러 처리를 해 주세요.
- `app/services/nft_service.py`는 payload → short_token 역추적 검증을 수행하므로, 서버 측에 조작된 payload를 전송해도 등록되지 않습니다.
