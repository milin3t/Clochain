# CloChain Server (FastAPI)

서버는 CloChain v2의 신뢰 핵심 계층으로, DID 세션 관리·QR 발급/검증·NFT 등록 기록·체인 연동을 책임진다. 모든 short_token은 서버 DB(PostgreSQL)에 보관되고, mint는 서버 전용 지갑(owner key)만 호출할 수 있다. 클라이언트는 transfer를 제외한 어떠한 온체인 트랜잭션도 직접 수행하지 않는다.

---

## 책임 구역

| 영역 | 서버 역할 |
| --- | --- |
| DID 인증 | thirdweb에서 전달받은 walletAddress로 nonce 발급(`POST /auth/wallet/request`), 지갑 서명 검증 후 JWT 발급(`POST /auth/wallet/verify`). 모든 API는 이 JWT를 통한 Bearer 인증이 필수다. |
| QR 발급/검증 | `POST /issue`에서 payload + HMAC signature + short_token 생성, `GET /verify`로 payload/서명을 복원·검증. short_token은 DB `issues` 테이블에 저장되며, DB가 없으면 어떤 QR도 검증할 수 없다. |
| NFT 등록 | `POST /nft/register`가 short_token을 검증한 뒤 Pinata metadata 업로드, 서버 지갑으로 `mintAuthenticityToken(to, tokenURI)` 실행, `nfts` 테이블에 기록. mint 실패 시 등록은 존재하지 않는 것으로 취급한다. |
| 소유권 추적 | `POST /nft/record-transfer`로 체인 transfer 결과를 기록하고, `GET /nft/me`에서 DB/온체인을 병합해 최신 소유자를 반환한다. DB가 비어도 온체인에 존재하는 tokenId는 조회할 수 있으나, short_token이나 발급 이력은 반드시 DB에서만 확인된다. |
| 메타데이터/Pinata | `POST /nft/metadata`에서 short_token 기반 metadata를 생성하고 Pinata에 업로드한다. CID가 없으면 mint 절차도 진행되지 않는다. |

---

## 고정 플로우

1. **로그인**
   - App이 `/auth/wallet/request`로 nonce 요청 → 지갑 서명 → `/auth/wallet/verify`로 JWT 수령.
   - 서버는 JWT 없이 들어오는 요청을 모두 401/403으로 거부한다.
2. **QR 발급**
   - `/issue` 호출 시 payload `{brand, productId, purchaseAt, did, nonce, issuedAt}`를 DB에 저장하고, HMAC signature와 short_token을 생성한다.
   - short_token은 QR에 정확히 삽입되어야 하며 다른 URL이나 payload 변형은 허용되지 않는다.
3. **QR 검증 & NFT 등록**
   - `/verify`는 short_token을 디코딩해 payload·signature를 검증한다.
   - `/nft/register`는 JWT 지갑과 payload의 DID가 일치해야 진행되며, Pinata CID 업로드 후 서버 지갑이 mint를 실행한다. mint 결과(tokenId, txHash, cid)는 반드시 DB에 기록된다.
4. **소유권 이전**
   - 사용자가 체인에서 직접 `transferFrom`을 실행한 뒤 `/nft/record-transfer`를 호출해야 DB owner 정보가 갱신된다.
   - 서버는 transfer 트랜잭션을 절대 대행하지 않으며, 체인에서 실패한 transfer를 DB에 기록하지 않는다.
5. **워드로브 조회**
   - `/nft/me`는 DB에서 owner_wallet이 일치하는 token을 우선 조회한 뒤, Polygon Amoy `ownerOf/tokenURI`를 순회해 DB에 없는 tokenId도 보완한다.
   - metadata는 tokenURI를 IPFS 게이트웨이로 조회해 브랜드/상품 정보를 복원한다.

모든 DID는 `did:ethr:<wallet>` 형식이어야 하며, payload에 다른 포맷이 오면 서버가 즉시 거절한다.

---

## 데이터 모델

| 테이블 | 용도 |
| --- | --- |
| `users` | 로그인한 walletAddress와 DID를 1:1로 매핑. nonce 발급 시 자동 생성. |
| `issues` | short_token, payload, signature를 저장. QR 검증은 항상 이 테이블을 참조한다. |
| `nfts` | tokenId, ownerWallet, Pinata CID, payload 정보를 저장. mint 직후 생성되며 중복 등록을 차단한다. |
| `transfers` | 체인 transfer 결과(txHash, blockNumber)를 기록해 소유권 이력을 추적한다. |
| `sessions` | 발급된 JWT 토큰과 만료 시각을 저장. 무효화 시 재로그인을 강제한다. |

DB는 반드시 영구 저장(PostgreSQL 등)이어야 하며, 파일 기반 SQLite는 재배포 시 데이터가 소실된다. 서버는 `DATABASE_URL`만으로 접속을 구성하고, 나머지 스키마는 `init_db()`가 자동으로 생성한다.

---

## 체인 연동 규칙

1. 서버는 web3.py와 `SERVER_PRIVATE_KEY`로만 mint 트랜잭션을 전송한다. 사용자 지갑은 `/nft/register`와 무관하다.
2. Transfer는 표준 ERC-721 `transferFrom`에 의존하며, 서버는 chain 상태를 감시하지 않는다. 사용자가 `/nft/record-transfer`를 호출하지 않으면 DB owner 정보는 갱신되지 않는다.
3. `/nft/me`가 ownerOf/tokenURI를 순회할 수 있도록 컨트랙트는 `totalMinted()`를 제공해야 한다. tokenId가 연속되지 않으면 해당 구간은 조회되지 않는다.
4. Pinata CID가 만료되면 metadata 복원이 불가능하므로, App은 tokenURI가 빈 문자열일 수 있음을 인지해야 한다.

---

## 참고

- 서버는 CloChain Shop/App/Contracts와 함께 동작하는 공통 백엔드다. API 명세(경로, 응답 구조)는 어떤 이유로도 변경할 수 없다.
- QR 검증은 온체인 정보를 사용하지 않으며, short_token + signature가 유일한 진위 판단 기준이다.
- `/nft/me`가 온체인 상태를 병합하더라도, short_token 발급 이력·서명 검증 등은 DB가 없으면 복구할 수 없다. 따라서 Postgres와 같은 영구 DB를 반드시 사용해야 한다.
