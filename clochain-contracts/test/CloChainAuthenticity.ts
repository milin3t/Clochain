import { expect } from "chai";
import { ethers } from "hardhat";

const metadataUri = "ipfs://example";

describe("CloChainAuthenticity", () => {
  async function deployFixture() {
    const [owner, user, other] = await ethers.getSigners();
    const contract = await ethers.deployContract("CloChainAuthenticity");
    await contract.waitForDeployment();
    return { contract, owner, user, other };
  }

  it("deploys with expected config", async () => {
    const { contract, owner } = await deployFixture();
    expect(await contract.name()).to.equal("CloChain Authenticity");
    expect(await contract.symbol()).to.equal("CLOAUTH");
    expect(await contract.owner()).to.equal(owner.address);
  });

  it("mints when called by owner", async () => {
    const { contract, user } = await deployFixture();
    const productHash = ethers.id("sku-123");
    const tx = await contract.mintAuthenticityToken(
      user.address,
      productHash,
      metadataUri
    );
    await tx.wait();
    expect(await contract.ownerOf(1n)).to.equal(user.address);
    expect(await contract.tokenURI(1n)).to.equal(metadataUri);
    expect(await contract.isProductHashConsumed(productHash)).to.be.true;
  });

  it("reverts if non-owner tries to mint", async () => {
    const { contract, user } = await deployFixture();
    const hash = ethers.id("sku-456");
    await expect(
      contract
        .connect(user)
        .mintAuthenticityToken(user.address, hash, metadataUri)
    ).to.be.revertedWithCustomError(contract, "OwnableUnauthorizedAccount");
  });

  it("reverts on duplicate product hash", async () => {
    const { contract, user } = await deployFixture();
    const hash = ethers.id("sku-789");
    await contract.mintAuthenticityToken(user.address, hash, metadataUri);
    await expect(
      contract.mintAuthenticityToken(user.address, hash, metadataUri)
    ).to.be.revertedWith("Product already minted");
  });
});
