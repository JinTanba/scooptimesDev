import type { NextApiRequest, NextApiResponse } from "next";
import factoryArtifact from "../../EtherFunFactory.json";
import saleArtifact from "../../EtherfunSale.json";
import { ethers } from "ethers";
import { DisplayData, SaleCreatedEvent } from "../../types";

const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c";
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");

// struct Sale {
//     address creator;
//     string name;
//     string symbol;
//     uint256 totalRaised;
//     uint256 saleGoal;
//     bool launched;
//     uint256 creationNonce;
// }
// struct SaleMetadata {
//     string logoUrl;
//     string websiteUrl;
//     string twitterUrl;
//     string telegramUrl;
//     string description;
//     string[] relatedLinks;
// }



export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    // /api/getNewsDisplayData?address=${address}
    const address = req.query.address as string;
    console.log("🔥🔥🔥🔥🔥🔥address", req.query.address);
    if(!address) return res.status(400).json({ error: "address is required" });
    const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider);
    const sale = new ethers.Contract(address, saleArtifact.abi, provider);
    const saleMetadata = await factory.getSaleMetadata(address);
    console.log("🔥saleMetadata", saleMetadata);
    const saleData = await Promise.all([
        sale.name(),
        sale.symbol(),
        sale.totalRaised(),
        sale.saleGoal(),
        sale.launched(),
    ]);
    console.log("🔥saleData", saleData);
    const displayData: DisplayData = {
        name: saleData[0],
        symbol: saleData[1],
        logoUrl: saleMetadata.logoUrl,
        websiteUrl: saleMetadata.websiteUrl,
        twitterUrl: saleMetadata.twitterUrl,
        telegramUrl: saleMetadata.telegramUrl,
        description: saleMetadata.description,
        relatedLinks: saleMetadata.relatedLinks,
        totalRaised: saleData[2].toString(),
        saleGoal: saleData[3].toString(),
        launched: saleData[4],
    }

    console.log("🔥displayData", displayData);
    res.status(200).json(displayData);
}