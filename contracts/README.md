# CloChain Contracts (Hardhat)

Polygon Amoy용 ERC721(ERC721URIStorage) 컨트랙트를 Hardhat로 관리합니다. CloChain App(ThirdWeb 지갑)이 직접 `mintAuthenticityToken`을 호출하며, 서버는 QR payload hash와 서명만 제공합니다.

## 컨트랙트 특징

- OpenZeppelin `ERC721URIStorage` + `Ownable`
- `mintAuthenticityToken(bytes32 payloadHash, string tokenURI, bytes signature)`  
  - payloadHash는 서버가 QR payload를 HMAC 등으로 해싱해 전달  
  - `enforceServerSignature`가 true이면 서버 서명 필수, false면 선택
- payload 재사용 방지: `consumedPayloadHashes`
- owner 함수: `setMetadataSigner`, `setEnforceServerSignature`
- 이벤트: `AuthenticityMinted`, signer/enforce 변경 이벤트

## 설치 및 스크립트

```bash
cd contracts
npm install

npm run compile    # 솔리디티 컴파일
npm run test       # (TODO) 테스트 실행
npm run deploy     # Polygon Amoy 배포 (env 필요)
npm run lint       # solhint
```

`.env` (예시):

```
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/...
PRIVATE_KEY=0x<deployer wallet private key>
POLYGONSCAN_API_KEY=<optional>
```

> 배포자는 CloChain 오너 지갑과 동일하게 유지해야 하며, 절대 개인키를 커밋하지 마세요.

## 사용 흐름

1. 서버가 QR payload → `payloadHash` + 서명을 생성해 앱에 전달.
2. CloChain App이 ThirdWeb 지갑으로 `mintAuthenticityToken(payloadHash, tokenURI, signature)` 트랜잭션을 보냄.
3. 체인에서 tokenId가 발급되면 App이 `/nft/record` API로 DB에 기록.
4. 표준 ERC721 `transferFrom`/`safeTransferFrom` 으로 양도, 서버는 `/nft/record-transfer`로 기록만 남김.

## 추가 참고

- 배포 후 나온 컨트랙트 주소는 App/Server `.env`에 즉시 반영하세요.
- 서버와 컨트랙트의 signer 주소가 어긋나면 `Invalid server signature` 에러가 발생합니다.
- 테스트넷에서 자유 mint 모드를 쓰고 싶으면 `setEnforceServerSignature(false)`를 호출하면 됩니다.
