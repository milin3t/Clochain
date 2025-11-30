import { ethers } from "hardhat";

async function main() {
  const metadataSigner =
    process.env.METADATA_SIGNER_ADDRESS ?? ethers.ZeroAddress;

  if (!process.env.METADATA_SIGNER_ADDRESS) {
    console.warn(
      "[deploy] METADATA_SIGNER_ADDRESS was not provided. " +
        "The contract will start with signature enforcement disabled."
    );
  }

  const contract = await ethers.deployContract(
    "CloChainAuthenticityNFT",
    [metadataSigner],
    {}
  );

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`CloChainAuthenticityNFT deployed to: ${contractAddress}`);
  console.log(`Metadata signer: ${metadataSigner}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
