import { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers'
import { factory, provider, ramdomProvider,factoryAddress } from '@/lib/utils' // この中でfactory, providerはサーバーサイドで使える前提

interface DisplayData {
  name: string
  symbol: string
  logoUrl: string
  websiteUrl: string
  twitterUrl: string
  telegramUrl: string
  description: string
  relatedLinks: string[]
  totalRaised: string
  saleGoal: string
  launched: boolean
  balance: string
  claimable: boolean
  positiveToken?: string
  negativeToken?: string
  saleContractAddress?: string
}
export const config = {
    maxDuration: 300
}
  
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { address, news } = req.body; 
    if (!address || !news) {
      return res.status(400).json({ error: 'Missing address or news data' });
    }

    // ユーザーが購入したトークンアドレスを取得
    const userBoughtTokens = await factory.getUserBoughtTokens(address);

    const tokenList = await Promise.all(
      userBoughtTokens.map(async (tokenAddress: string) => {
        const saleData: DisplayData | undefined = news.find((item: DisplayData) => item.saleContractAddress === tokenAddress)
        if (!saleData) {
          // 該当するsaleDataがない場合はスキップしても良い
          return null;
        }

        // トークンバランス取得ロジック
        let balance: string;
        if (saleData.launched) {
          const positiveTokenContract = new ethers.Contract(
            saleData.positiveToken as string, 
            ["function balanceOf(address) external view returns (uint256)"], 
            ramdomProvider()
          );
          const negativeTokenContract = new ethers.Contract(
            saleData.negativeToken as string, 
            ["function balanceOf(address) external view returns (uint256)"], 
            ramdomProvider()
          );
          let [positiveTokenBalance, negativeTokenBalance] = await Promise.all([
            positiveTokenContract.balanceOf(address),
            negativeTokenContract.balanceOf(address)
          ])
          positiveTokenBalance = ethers.utils.formatEther(positiveTokenBalance)
          negativeTokenBalance = ethers.utils.formatEther(negativeTokenBalance)
          balance = `positive: ${positiveTokenBalance} / negative: ${negativeTokenBalance}`
        } else {
          const saleContract = new ethers.Contract(
            tokenAddress, 
            ["function tokenBalances(address) external view returns (uint256)"], 
            ramdomProvider()
          );
          const rawBalance = await saleContract.tokenBalances(address);
          balance = ethers.utils.formatEther(rawBalance)
        }

        return {
          ...saleData,
          balance: balance,
          tokenRaised: ethers.utils.formatEther(saleData.totalRaised)
        };
      })
    );

    // nullが入っていたらフィルタリング
    const filteredList = tokenList.filter((t) => t !== null);

    return res.status(200).json({ tokenList: filteredList });
  } catch (error) {
    console.error("Error fetching user tokens:", error);
    return res.status(500).json({ error: "Error fetching user tokens" });
  }
}
