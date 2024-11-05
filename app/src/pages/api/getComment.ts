import type { NextApiRequest, NextApiResponse } from "next";
import factoryArtifact from "../../../artifacts/contracts/Factory.sol/EtherFunFactory.json";
import saleArtifact from "../../../artifacts/contracts/SaleContract.sol/EtherFunSale.json";
import { ethers } from "ethers";


const provider = new ethers.providers.JsonRpcProvider("https://base-sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;
  const saleContract = new ethers.Contract(address as string, saleArtifact.abi, provider);
  

}