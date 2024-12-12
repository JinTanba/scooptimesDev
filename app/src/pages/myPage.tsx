import { useSignerStore } from "@/lib/walletConnector";
import { ethers } from "ethers"
import { useEffect, useState } from "react";
import factoryArtifact from "../EtherFunFactory.json"
import Link from "next/link"
import Image from "next/image"
import { Search, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { factory, provider } from "@/lib/utils";
import { useNewsStore } from "@/lib/NewsState";
import router from "next/router";

export interface DisplayData {
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
}

const ibmPlexSans = IBM_Plex_Sans({
    weight: ['300', '400', '500', '600'],
    subsets: ['latin', 'latin-ext', 'cyrillic'],
    display: 'swap',
})

const ibmPlexSerif = IBM_Plex_Serif({
    weight: ['400', '500', '600', '700'],
    subsets: ['latin'],
    display: 'swap',
})

const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c"

export default function UserPage() {
    const wallet = useSignerStore(state => state.signer);
    const [userTokenList, setUserTokenList] = useState<DisplayData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const _news = useNewsStore(state => state.news)


    useEffect(() => {
        async function getUserWalletAddress() {
            setIsLoading(true);
            console.log("----------------  userBoughtTokens  -----------------")
            try {
                if (wallet) {
                    console.log("----------------  wallet  -----------------")
                    const address = await wallet.getAddress();
                    let userBoughtTokens = await factory.getUserBoughtTokens(address);
                    console.log("----------------  userBoughtTokens  -----------------", userBoughtTokens)
                    const tokenList = await Promise.all(
                        userBoughtTokens.map(async (tokenAddress: string) => {
                            const saleData = _news.find(item => item.saleContractAddress === tokenAddress)
                            const saleContract = new ethers.Contract(
                                tokenAddress, 
                                [
                                    "function tokenBalances(address) external view returns (uint256)",
                                ], 
                                provider
                            );
                            const balance = await (async() => {
                              if(saleData?.launched) {
                                const positiveTokenContract = new ethers.Contract(saleData.positiveToken, ["function balanceOf(address) external view returns (uint256)"], provider);
                                const negativeTokenContract = new ethers.Contract(saleData.negativeToken, ["function balanceOf(address) external view returns (uint256)"], provider);
                                let [positiveTokenBalance, negativeTokenBalance] = await Promise.all([
                                  positiveTokenContract.balanceOf(address),
                                  negativeTokenContract.balanceOf(address)
                                ])
                                positiveTokenBalance = ethers.utils.formatEther(positiveTokenBalance)
                                negativeTokenBalance = ethers.utils.formatEther(negativeTokenBalance)
                                return `positive: ${positiveTokenBalance} / negative: ${negativeTokenBalance}`
                              } else {
                                const balance = await saleContract.tokenBalances(address)
                                return ethers.utils.formatEther(balance)
                              }
                            })()
                            return {
                                ...saleData,
                                balance: balance
                            }
                        })
                    );
        
                    console.log("🔥🔥🔥🔥🔥🔥tokenList", tokenList);
                    setUserTokenList(
                        tokenList.map(token => ({
                            tokenRaised: ethers.utils.formatEther(token.totalRaised),
                            ...token
                        }))
                    );
                }
            } catch (error) {
                console.error("Error fetching user wallet address:", error);
            } finally {
                setIsLoading(false);
            }
        }
        getUserWalletAddress();
    }, [wallet, _news]);

    return (
        <>
            <div className="max-w-[80%] mx-auto mt-4">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/')}
                    className="mb-1"
                >
                    ← Back
                </Button>
            </div>
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <UserTokenList userTokenList={userTokenList} />
            )}
        </>
    )
}



function UserTokenList({ userTokenList }: { userTokenList: DisplayData[] }) {
  const handleClaim = (tokenSymbol: string) => {
    console.log(`Claiming rewards for ${tokenSymbol}`);
    // Implement claim logic here
  };

  return (
    <div className="w-full max-w-[80%] mx-auto mt-8 overflow-hidden">
    <h1 className={`text-center text-[30px] font-[0] text-black mb-4 ${ibmPlexSerif.className}`}>Portfolio</h1>
    <Card className="rounded-3xl">
      <CardContent className="p-6 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold whitespace-nowrap">Logo</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Name</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Symbol</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Total Raised</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Launched</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Description</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Balance</TableHead>
              <TableHead className="font-semibold whitespace-nowrap">Claim</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userTokenList.map((token, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="py-4 whitespace-nowrap">
                  <Image
                    src={token.logoUrl}
                    alt={`${token.name} logo`}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </TableCell>
                <TableCell className={`font-medium ${ibmPlexSans.className} whitespace-nowrap`}>{token.name}</TableCell>
                <TableCell className="whitespace-nowrap">{token.symbol}</TableCell>
                <TableCell className="whitespace-nowrap">{ethers.utils.formatEther(token.totalRaised).slice(0, 7)}</TableCell>
                <TableCell className="whitespace-nowrap">{token.launched ? 'Yes' : 'No'}</TableCell>
                <TableCell className="whitespace-nowrap">{token.description.slice(0, 10)}...</TableCell>
                <TableCell className="whitespace-nowrap">{token.balance}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Button
                    onClick={() => handleClaim(token.symbol)}
                    disabled={!token.claimable}
                    className={`${
                      token.claimable
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    } transition-colors duration-200`}
                  >
                    Claim
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
  )
}

