import type { NextApiRequest, NextApiResponse } from "next";
import factoryArtifact from "../../EtherFunFactory.json";
import saleArtifact from "../../EtherfunSale.json";
import { ethers } from "ethers";
import { calcMarketcap } from "@/lib/UniswapRouter";

const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c";
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");
const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider);
export const config = {
  maxDuration: 300
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('getNews//////');
    const latestBlock = await provider.getBlockNumber();
    console.log(latestBlock);
    const filter = factory.filters.SaleCreated();
    const events = await factory.queryFilter(filter, 7018959, latestBlock);

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
        let positiveToken = "";
        let negativeToken = "";
        try {
            [totalRaised, launched, positiveToken, negativeToken] = await Promise.all([
              saleContract.totalRaised(),
              saleContract.launched(),
              saleContract.positiveToken(),
              saleContract.negativeToken(),
            ]);
        } catch (error) {
            console.error('Error fetching sale data:', error);
        }

        console.log(totalRaised.toString(), launched);

        const [positiveMarketcap, negativeMarketcap] = launched ? await Promise.all([
          calcMarketcap(positiveToken, provider),
            calcMarketcap(negativeToken, provider)
          ]) : [0, 0]

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
            launched: launched,
            positiveMarketcap,
            negativeMarketcap
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