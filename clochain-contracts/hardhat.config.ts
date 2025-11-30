import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const amoyRpcUrl = process.env.AMOY_RPC_URL || "https://polygon-amoy.drpc.org";
const serverPrivateKey =
  process.env.SERVER_PRIVATE_KEY || process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    amoy: {
      url: amoyRpcUrl,
      accounts: serverPrivateKey ? [serverPrivateKey] : [],
      chainId: 80002,
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
    },
  },
};

export default config;
