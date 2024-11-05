import type { NextApiRequest, NextApiResponse } from "next";
import factoryArtifact from "../EtherFunFactory.json";
import saleArtifact from "../EtherfunSale.json";
import { ethers } from "ethers";
import { SaleCreatedEvent } from "../../types";

const factoryAddress = "0xa24e1a98642a63961FBBb662B7CfC41cbd313FC9";
const provider = new ethers.providers.JsonRpcProvider("https://base-sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");
const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const latestBlock = await provider.getBlockNumber();
    const filter = factory.filters.SaleCreated();
    const events = await factory.queryFilter(filter, 0, latestBlock);

    // Process events and fetch sale data concurrently
    const processedData = await Promise.all(
      events.map(async (event) => {
        const args = event.args;
        if (!args) {
          return {
            event: null,
            sale: null
          };
        }

        const { 
          saleContractAddress, 
          creator, 
          name, 
          symbol, 
          saleGoal, 
          logoUrl, 
          websiteUrl, 
          twitterUrl, 
          telegramUrl, 
          description,
          relatedLinks
        } = args;

        // Format event data and fetch sale data in parallel
        // const sale = await factory.sale(saleContractAddress);
        const saleContract = new ethers.Contract(saleContractAddress, saleArtifact.abi, provider);
        let totalRaised = 0;
        let launched = false;
        try {
            [totalRaised, launched] = await Promise.all([
              saleContract.totalRaised(),
              saleContract.launched()
            ]);
        } catch (error) {
            console.error('Error fetching sale data:', error);
        }

        console.log(totalRaised.toString(), launched);

        const _event = {
            saleContractAddress,
            creator,
            name,
            symbol,
            saleGoal: saleGoal.toString(),
            logoUrl,
            websiteUrl,
            twitterUrl,
            telegramUrl,
            description,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            totalRaised: totalRaised.toString(),
            relatedLinks,
            launched: launched
        }

        console.log(_event);

        return _event
      })
    );



    return res.status(200).json({
      success: true,
      data: {
        sales: processedData
      }
    });

  } catch (error) {
    console.error('Error fetching SaleCreated events:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch SaleCreated events'
    });
  }
}