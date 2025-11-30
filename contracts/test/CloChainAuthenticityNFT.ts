import { expect } from "chai";
import { ethers } from "hardhat";

describe("CloChainAuthenticityNFT", function () {
  const tokenURI = "ipfs://sample";
  const payloadHash = ethers.keccak256(ethers.toUtf8Bytes("payload-1"));

  async function deploy() {
    const [deployer, minter] = await ethers.getSigners();
    const serverWallet = ethers.Wallet.createRandom();
    const contract = await ethers.deployContract("CloChainAuthenticityNFT", [
      serverWallet.address
    ]);
    await contract.waitForDeployment();
    return { contract, deployer, minter, serverWallet };
  }

  it("mints when provided payload is signed by the server", async function () {
    const { contract, minter, serverWallet } = await deploy();

    const signature = await serverWallet.signMessage(
      ethers.getBytes(payloadHash)
    );

    await expect(
      contract.connect(minter).mintAuthenticityToken(payloadHash, tokenURI, signature)
    )
      .to.emit(contract, "AuthenticityMinted")
      .withArgs(1n, minter.address, payloadHash, tokenURI);
  });

  it("rejects minting with invalid signatures when enforcement is on", async function () {
    const { contract, minter } = await deploy();
    const badSignature = ethers.Signature.from({
      r: "0x" + "11".repeat(32),
      s: "0x" + "22".repeat(32),
      v: 27
    }).serialized;

    await expect(
      contract.connect(minter).mintAuthenticityToken(payloadHash, tokenURI, badSignature)
    ).to.be.revertedWith("Invalid server signature");
  });

  it("allows owner to disable server signature enforcement", async function () {
    const { contract, deployer, minter } = await deploy();

    await contract.connect(deployer).setEnforceServerSignature(false);

    await expect(
      contract.connect(minter).mintAuthenticityToken(payloadHash, tokenURI, "0x")
    ).to.emit(contract, "AuthenticityMinted");
  });
});
