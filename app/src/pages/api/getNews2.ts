import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import { calcMarketcap } from "@/lib/UniswapRouter";
import saleArtifact from "../../EtherfunSale.json";

const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/96089/skininthegame2/version/latest";
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");

export const config = {
  maxDuration: 300
}

async function fetchSaleEvents() {
  const query = `
    query GetSaleEvents($blockNumber: BigInt!) {
      saleCreateds(
        where: { blockNumber_gte: $blockNumber }
        orderBy: blockNumber
        orderDirection: desc
      ) {
        id
        saleContractAddress
        creator
        name
        symbol
        saleGoal
        logoUrl
        websiteUrl
        twitterUrl
        telegramUrl
        description
        relatedLinks
        blockNumber
        transactionHash
      }
    }
  `;

  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        blockNumber: 7018959
      }
    }),
  });

  const { data } = await response.json();
  return data.saleCreateds;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('--------------------------------------------------------//////////getNews//////-----------------------------------------------------------------');
    const events = await fetchSaleEvents();

    console.log(events)

    // Process events and fetch additional data
    const processedData = await Promise.all(
      events.map(async (event: any) => {
        const saleContractAddress = event.saleContractAddress;
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

        const [positiveMarketcap, negativeMarketcap] = launched ? await Promise.all([
          calcMarketcap(positiveToken, provider),
          calcMarketcap(negativeToken, provider)
        ]) : [0, 0];

        return {
          ...event,
          saleGoal: event.saleGoal.toString(),
          totalRaised: totalRaised.toString(),
          launched,
          positiveMarketcap,
          negativeMarketcap
        };
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