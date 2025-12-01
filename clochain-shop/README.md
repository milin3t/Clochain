# CloChain Shop (React/Vite)

브랜드/리테일러가 QR을 발급하고 누구나 short_token을 검증할 수 있는 정품 발행 UI다. Shop은 FastAPI 서버와만 통신하며, 블록체인 트랜잭션이나 thirdweb 지갑 연동을 수행하지 않는다. QR의 진위는 서버 DB에 저장된 short_token과 HMAC signature만으로 판단한다.

---

## 역할 구분

| 화면 | 고정 역할 |
| --- | --- |
| `/shop/:brand/issue` | 브랜드/상품 ID, 구매일, 최초 소유자 wallet(DID)을 입력받아 `POST /issue`를 호출한다. 서버가 반환한 payload·signature·short_token·QR(base64)을 그대로 노출하며, 데이터를 변형하거나 가공하지 않는다. short_token은 반드시 고객에게 전달되어 CloChain App에서 스캔해야 한다. |
| `/shop/verify` | URL 파라미터 또는 입력한 short_token으로 `GET /verify`를 호출한다. 서버가 반환한 payload, signature, 등록 여부를 그대로 보여주며, owner wallet/metadata 링크도 서버 응답 그대로 표기한다. |
| NotFound | 잘못된 경로 접근 시 `/shop`으로 되돌린다. |

Shop은 로그인/세션 로직이 없고, 사용자에게 지갑 주소를 직접 입력받는다. DID는 항상 `did:ethr:<wallet>` 형식을 강제한다.

---

## 플로우

1. **QR 발급**
   - 매장 직원이 `/shop/:brand/issue`에서 브랜드, productId, purchaseAt, 최초 소유자 wallet을 입력한다.
   - `POST /issue` 호출 → 서버는 payload + HMAC signature + short_token + QR 이미지를 생성해 DB(`issues`)에 기록한다.
   - Shop은 base64 QR 미리보기와 short_token 텍스트를 그대로 출력하고, 고객에게 short_token을 안전하게 전달하도록 안내한다. Shop은 short_token을 재생성할 수 없다.
2. **QR 검증**
   - `/shop/verify?q=<short_token>`로 접근하거나 입력 폼에 short_token을 직접 넣는다.
   - `GET /verify` 결과에 따라 ok/registered 여부, payload 내용, signature 등을 그대로 표시한다. UI는 서버 응답을 숨기거나 바꾸지 않는다.
   - NFT가 이미 등록되어 tokenId가 존재하면 owner wallet/metadata 링크도 함께 노출한다. 이는 조회 목적일 뿐 소유권 변경을 수행하지 않는다.
3. **재확인/재발급**
   - short_token 문자열은 QR 이미지 외에도 전표/메일 등으로 고객에게 전달해야 한다. Shop UI는 short_token을 다시 만들 수 없으므로 분실 시 서버 DB와 매칭되지 않는다.

---

## 기술 규칙

- React 19 + Vite + TypeScript + TailwindCSS로 구성된 UI 애플리케이션이다.
- Axios로 FastAPI `/issue`, `/verify` 엔드포인트만 호출한다. 기타 `/nft/*` API는 Shop에서 호출하지 않는다.
- QR 스캔 기능은 제공하지 않으며, short_token 입력만 지원한다. 실제 스캔은 CloChain App에서 수행한다.
- 서버 응답값(payload, signature, registered 등)을 변형하거나 추가 로직을 적용하지 않는다. Shop은 오직 발급/조회 UI만 담당한다.

---

## 유의사항

- 최초 소유자 wallet 주소를 잘못 입력하면 CloChain App의 `/nft/register` 단계에서 지갑 불일치로 거절된다. 매장 직원이 정보를 정확히 입력해야 한다.
- short_token은 서버 DB의 단일 진실(source of truth)이며, Shop에서 임의로 생성할 수 없다. 발급된 short_token은 반드시 고객에게 전달해 복구 가능성을 확보해야 한다.
- `/shop/verify`는 완전 공개 페이지다. 브랜드 안내 문구나 고객지원 정보를 추가로 표시할 수 있지만, 서버 응답(payload/registered)을 숨기거나 변경하면 안 된다.

Shop은 CloChain App/FastAPI/Contracts와 분리된 프런트엔드 UI로, 위 규칙을 반드시 지켜야 전체 서비스가 정상적으로 동작한다.
