// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title CloChainAuthenticityNFT
 * @notice ERC-721 contract where wallet owners mint authenticity NFTs directly.
 *         The server only provides signed payload hashes that are checked on-chain
 *         to ensure each QR payload can be minted exactly once.
 */
contract CloChainAuthenticityNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    address public metadataSigner;
    bool public enforceServerSignature;

    mapping(bytes32 => bool) public consumedPayloadHashes;

    event AuthenticityMinted(
        uint256 indexed tokenId,
        address indexed owner,
        bytes32 indexed payloadHash,
        string tokenURI
    );
    event MetadataSignerUpdated(address indexed newSigner);
    event EnforceServerSignatureUpdated(bool enforce);

    constructor(address initialSigner)
        ERC721("CloChain Authenticity NFT", "CLOCHAIN")
        Ownable(msg.sender)
    {
        metadataSigner = initialSigner;
        enforceServerSignature = initialSigner != address(0);
    }

    /**
     * @notice Mint a new authenticity NFT to the caller.
     * @param payloadHash Server produced hash of the QR payload.
     * @param tokenURI Full token metadata URI (ipfs://CID from Pinata).
     * @param signature Server signature proving the payload hash authenticity.
     */
    function mintAuthenticityToken(
        bytes32 payloadHash,
        string calldata tokenURI,
        bytes calldata signature
    ) external returns (uint256) {
        require(payloadHash != bytes32(0), "Invalid payload");
        require(!consumedPayloadHashes[payloadHash], "Payload already used");

        if (enforceServerSignature) {
            require(signature.length > 0, "Missing server signature");
            require(
                _isValidSignature(payloadHash, signature),
                "Invalid server signature"
            );
        } else if (signature.length > 0) {
            require(
                _isValidSignature(payloadHash, signature),
                "Signature mismatch"
            );
        }

        consumedPayloadHashes[payloadHash] = true;

        _nextTokenId += 1;
        uint256 newTokenId = _nextTokenId;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        emit AuthenticityMinted(newTokenId, msg.sender, payloadHash, tokenURI);
        return newTokenId;
    }

    function setMetadataSigner(address newSigner) external onlyOwner {
        metadataSigner = newSigner;
        emit MetadataSignerUpdated(newSigner);
    }

    function setEnforceServerSignature(bool enforce) external onlyOwner {
        enforceServerSignature = enforce;
        emit EnforceServerSignatureUpdated(enforce);
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function _isValidSignature(bytes32 payloadHash, bytes calldata signature)
        internal
        view
        returns (bool)
    {
        if (metadataSigner == address(0)) {
            return false;
        }

        bytes32 digest = ECDSA.toEthSignedMessageHash(payloadHash);
        address recoveredSigner = ECDSA.recover(digest, signature);
        return recoveredSigner == metadataSigner;
    }
}
