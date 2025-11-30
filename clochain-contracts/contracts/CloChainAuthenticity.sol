// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CloChainAuthenticity
 * @notice ERC721 collection for CloChain where only the server wallet can mint.
 */
contract CloChainAuthenticity is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(bytes32 => bool) private _consumedProductHashes;

    event AuthenticityMinted(
        uint256 indexed tokenId,
        address indexed to,
        bytes32 indexed productHash,
        string tokenURI
    );

    constructor() ERC721("CloChain Authenticity", "CLOAUTH") Ownable(msg.sender) {}

    /**
     * @notice Mints a new authenticity NFT for a CloChain user.
     * @dev Only callable by the contract owner (server EOA).
     * @param to Recipient wallet (user DID wallet address).
     * @param productHash Unique hash for the product payload.
     * @param tokenURI IPFS metadata URI.
     */
    function mintAuthenticityToken(
        address to,
        bytes32 productHash,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(productHash != bytes32(0), "Invalid product hash");
        require(bytes(tokenURI).length > 0, "TokenURI required");
        require(!_consumedProductHashes[productHash], "Product already minted");

        _nextTokenId += 1;
        uint256 newTokenId = _nextTokenId;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        _consumedProductHashes[productHash] = true;
        emit AuthenticityMinted(newTokenId, to, productHash, tokenURI);

        return newTokenId;
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function isProductHashConsumed(bytes32 productHash) external view returns (bool) {
        return _consumedProductHashes[productHash];
    }
}
