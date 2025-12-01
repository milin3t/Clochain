# CloChain Contracts (Hardhat)

Polygon Amoy에서 동작하는 `CloChainAuthenticity` ERC-721 컬렉션은 CloChain 서비스 전반의 온체인 신뢰 기준이다. 컨트랙트는 서버 전용 지갑만 mint할 수 있는 구조이며, 사용자 지갑은 transfer를 통해서만 소유권을 이동시킨다. 체인 상의 모든 tokenId는 CloChain 서버가 발행한 short_token과 1:1로 매핑되며, 중복 payload를 방지하기 위한 hash 검증이 강제된다.

---

## 핵심 규칙

1. **OnlyOwner Mint**
   - `mintAuthenticityToken(address to, bytes32 productHash, string tokenURI)`는 `Ownable` 권한으로 제한된다. CloChain 서버만 이 함수를 호출할 수 있으며, 사용자 지갑이 직접 mint하는 구조는 허용하지 않는다.
2. **Payload Hash 관리**
   - `productHash`는 `{brand, productId, purchaseAt, wallet, nonce}`를 조합해 서버가 계산한 keccak256 값이다. 컨트랙트는 `mapping(bytes32 => bool)`으로 중복 hash를 차단한다.
   - 동일한 payload(또는 short_token)가 두 번 mint 되는 경우 컨트랙트에서 즉시 revert된다.
3. **TokenURI**
   - `tokenURI`는 Pinata CID 기반 `ipfs://` URI여야 하며, 서버가 metadata 업로드 후 전달한다. 메타데이터를 on-chain에 저장하지 않으므로, tokenURI가 비어 있거나 HTTP URL이면 허용되지 않는다.
4. **Transfer**
   - 표준 ERC-721 `transferFrom`/`safeTransferFrom`만 제공하며, 추가 제약을 두지 않는다. 사용자 지갑은 CloChain App을 통해 thirdweb signer로 직접 transfer를 실행한다.
5. **이벤트**
   - mint 시 `AuthenticityMinted(tokenId, to, productHash, tokenURI)`와 표준 `Transfer(0x0, to, tokenId)`가 발생한다. 서버는 이 이벤트를 이용해 tokenId를 식별한다.

---

## 컨트랙트 구성

| 파일 | 설명 |
| --- | --- |
| `contracts/CloChainAuthenticity.sol` | OpenZeppelin `ERC721URIStorage` + `Ownable` 기반 구현. `_nextTokenId`로 선형 tokenId를 생성하고, `mapping(bytes32 => bool)`로 payload hash를 추적한다. |
| `scripts/deploy.ts` | Hardhat signer(서버 지갑)로 배포한다. 배포 후 주소를 로그로 출력하며, 이 주소는 CloChain 서버/App이 공유해야 한다. |
| `test/CloChainAuthenticity.ts` | onlyOwner 제약, hash 중복 방지, 기본 mint 동작을 검증한다. |

네트워크는 `hardhat.config.ts`에서 Polygon Amoy(80002)만 정의되어 있다. 다른 체인으로 배포하려면 동일한 규칙을 유지한 채 config/network를 추가해야 한다.

---

## 동작 보증

- CloChain Server는 `productHash = keccak256(brand|productId|purchaseAt|wallet|nonce)`로 계산하고, 컨트랙트가 이미 소비한 hash를 재사용하지 않는다.
- 서버는 mint 시 항상 `to = customer wallet`을 전달하므로, on-chain 최초 owner는 고객 지갑이 된다. CloChain App은 이 tokenId를 서버 API에서 받아 투명하게 표시한다.
- 컨트랙트는 transfer 로직이나 metadata 구조를 알지 못한다. 모든 검증/서명은 서버와 App이 Off-chain에서 처리한다.

---

## 주의 사항

- `SERVER_PRIVATE_KEY`와 Hardhat 배포 signer는 동일해야 한다. 배포 주소와 서버 `.env`의 `SERVER_WALLET_ADDRESS`가 다르면 mint가 실패한다.
- `totalMinted()` 함수는 서버가 `/nft/me`에서 온체인 tokenId를 순회하는 데 쓰인다. 배포 시 `_nextTokenId`를 0에서 시작해 gap 없이 증가시켜야 한다.
- metadata CID가 삭제되면 tokenURI가 깨진다. Pinata 유지 정책을 준수하고, 필요하면 백업 전략을 마련해야 한다.

컨트랙트 스펙은 위 규칙을 벗어날 수 없으며, CloChain 서비스의 온체인 신뢰는 이 구조를 기반으로 유지된다.
