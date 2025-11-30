import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with server wallet: ${deployer.address}`);

  const contract = await ethers.deployContract("CloChainAuthenticity");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const network = await deployer.provider?.getNetwork();

  console.log(`CloChainAuthenticity deployed at: ${address}`);
  console.log(
    `Network: ${network?.name ?? "unknown"} (chainId: ${
      network?.chainId?.toString() ?? "unknown"
    })`
  );
  console.log("Owner:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
