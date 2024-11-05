require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// AlchemyのRPC URLを定数として定義
const ALCHEMY_RPC_URL = "https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65";
const SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65";
const PRIVATE_KEY = "68bf6ec02461aecaa2d401ff255a39dc1f97a23f4755837b0a06391513101846";
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: ALCHEMY_RPC_URL,
      },
      chainId: 1
    },
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    base_sepolia: {
      url: ALCHEMY_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 84532,
      gasPrice: "auto",
      verify: {
        etherscan: {
          apiUrl: "https://api-sepolia.basescan.org"
        }
      }
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto",
    }
  },
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true,
      metadata: {
        bytecodeHash: "none"
      }
    }
  }
};