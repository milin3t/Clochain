# CloChain

정품 인증서를 QR과 고객 지갑에 담아두는 서비스입니다. 매장에서 발급한 QR을 고객 앱이 스캔하면, 블록체인에 영구 보관된 “정품 NFT”가 지갑으로 들어와 언제든 소유권을 증명할 수 있습니다.

- CloChain Shop: https://clochain-shop.vercel.app
- CloChain App: https://clochain-app.vercel.app
- Tracking Transaction : 0x74a7010b5E1bD6b1Baa7F6841A16c66DF6b7e191

## CloChain이 하는 일

1. **매장에서 QR 발급** – 매장 직원이 CloChain Shop 화면에서 제품 정보를 입력하면, 서버가 해당 정보를 서명한 QR과 short_token을 생성합니다.
2. **고객이 QR 등록** – 고객은 CloChain App에서 QR을 스캔해 NFT를 자신의 지갑으로 등록합니다.
3. **누구나 검증** – QR이나 short_token만 있으면 CloChain Shop에서 제품 정보와 현재 소유자를 바로 확인할 수 있습니다.
4. **양도도 간편하게** – NFT는 Polygon 블록체인에 올라가 있기 때문에, 고객이 새로운 지갑으로 transfer하면 소유권도 즉시 바뀝니다.

## 구성 요소

- **CloChain Shop** – 매장 전용 화면입니다. QR을 발급(물건 구매)하고 short_token을 검증하는 역할을 합니다.
- **CloChain App** – 고객용 PWA입니다. QR 스캔, 워드로브(NFT 목록) 확인, 소유권 이전까지 담당합니다.
- **CloChain Server** – DID 로그인, QR 발급/검증, NFT 등록 기록, Pinata 업로드, Polygon mint를 담당합니다.
- **CloChain Contracts** – Polygon Amoy에 배포된 ERC-721 컨트랙트입니다. 서버 지갑만 mint할 수 있으며, 사용자는 transfer만 직접 서명합니다.

각 디렉터리의 README에 세부 흐름과 정책을 정리해 두었습니다.

## 왜 CloChain인가?

- **고객**은 정품 인증서를 자신의 지갑에 보관함으로써 분실 위험이 없습니다.
- **브랜드**는 QR 발급 기록과 short_token을 통해 AS·리세일 상황에서도 제품을 추적할 수 있습니다.
- **검증자**는 QR 하나만으로 “이 제품이 CloChain에서 발급한 정품인지” 즉시 확인할 수 있습니다.

CloChain은 QR·서버·블록체인 세 요소를 묶어 “정품 인증”이라는 목적을 단순하고 명확하게 제공합니다.

## 아키텍처 한눈에 보기

- **프런트엔드 (Vercel)**: Shop/App 모두 React 19 + Vite + Tailwind로 구현되어 있으며, Axios로 FastAPI 서버와 통신합니다. App은 thirdweb SDK를 사용해 In-App Wallet 로그인과 Polygon transfer 서명을 처리합니다.
- **백엔드 (Railway)**: FastAPI + PostgreSQL 조합으로 DID 인증, QR 발급/검증, NFT 등록 기록을 담당합니다. Pinata(IPFS)에 metadata를 저장하고 Polygon Amoy 컨트랙트에 mint 요청을 보냅니다.
- **블록체인 계층**: Polygon Amoy 네트워크에 배포된 `CloChainAuthenticity` ERC-721 컨트랙트는 서버 지갑만 mint할 수 있게 `Ownable`로 제한되어 있습니다. 사용자는 transfer 시 thirdweb 지갑으로 직접 서명합니다.

이 모노레포는 위 요소를 모두 포함하고 있어, QR 발급부터 온체인 소유권 관리까지 전체 플로우를 한 곳에서 확인할 수 있습니다.
