import type { NextApiRequest, NextApiResponse } from "next";
import factoryArtifact from "../EtherFunFactory.json";
import saleArtifact from "../EtherfunSale.json";
import { ethers } from "ethers";


const provider = new ethers.providers.JsonRpcProvider("https://base-sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;
  const saleContract = new ethers.Contract(address as string, saleArtifact.abi, provider);
  

}