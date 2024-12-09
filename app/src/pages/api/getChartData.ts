import type { NextApiRequest, NextApiResponse } from "next";
import { ethers } from "ethers";
import saleArtifact from "../../EtherfunSale.json";
import { CandleData } from "@/types";


const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");
export const config = {
  maxDuration: 300
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CandleData[]>,
) {
  try {
    console.log('getChartData//////////////////////////', req.query);
    const saleAddress = req.query.address as string;
    const sale = new ethers.Contract(saleAddress, saleArtifact.abi, provider);
    
    const historicalData = await sale.getAllHistoricalData();
    const candleData: CandleData[] = [];

    for (let i = 1; i < historicalData.length; i++) {
      const prev = historicalData[i - 1];
      const curr = historicalData[i];
      
      const prevValue = parseFloat(ethers.utils.formatEther(prev.totalRaised));
      const currValue = parseFloat(ethers.utils.formatEther(curr.totalRaised));
      
      candleData.push({
        time: curr.timestamp.toNumber(), 
        open: prevValue,
        close: currValue,
        high: Math.max(prevValue, currValue),
        low: Math.min(prevValue, currValue)
      });
    }
    console.log('candleData-------------------------------\n\n', candleData);
    res.status(200).json(candleData);
  } catch (error) {
    console.error('Error fetching and processing chart data:', error);
    res.status(500).json([]);
  }
}