const hre = require("hardhat");

async function main() {
  // デプロイアカウントの取得
  console.log("Getting signers...");
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Factory コントラクトのデプロイ
  console.log("\nDeploying EtherFunFactory...");
  const Factory = await hre.ethers.getContractFactory("EtherFunFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  console.log("EtherFunFactory deployed to:", await factory.getAddress());
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });