'use client'

import { useSignerStore } from "@/lib/walletConnector";
import { ethers } from "ethers"
import { useEffect, useState } from "react";
import factoryArtifact from "../EtherFunFactory.json"
import Link from "next/link"
import Image from "next/image"
import { Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

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
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65")

export default function UserPage() {
    const wallet = useSignerStore(state => state.signer);
    const [userTokenList, setUserTokenList] = useState<DisplayData[]>([]);

    useEffect(() => {
        async function getUserWalletAddress() {
            const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider);
            if (wallet) {
                const address = await wallet.getAddress();
                const userBoughtTokens = await factory.getUserBoughtTokens(address);
                
                const tokenList = await Promise.all(
                    userBoughtTokens.map(async (tokenAddress: string) => {
                        const saleContract = new ethers.Contract(
                            tokenAddress, 
                            [
                                "function tokenBalances(address) external view returns (uint256)",
                                "function totalRaised() external view returns (uint256)",
                                "function positiveToken() external view returns (address)",
                                "function negativeToken() external view returns (address)"
                            ], 
                            provider
                        );
    
                        // 並列でfetchとbalance取得を実行
                        const [fetchResponse, balance, positiveToken, negativeToken] = await Promise.all([
                            fetch(`/api/getNewsDisplayData?address=${tokenAddress}`),
                            saleContract.tokenBalances(address),
                            saleContract.positiveToken(),
                            saleContract.negativeToken()
                        ]);
    
                        if (!fetchResponse.ok) {
                            throw new Error(`API error: ${fetchResponse.status}`);
                        }
    
                        const fetchData = await fetchResponse.json();
                        if(fetchData.launched) {
                            console.log(positiveToken, negativeToken)
                            const positiveTokenContract = new ethers.Contract(positiveToken, ["function balanceOf(address) external view returns (uint256)"], provider);
                            const negativeTokenContract = new ethers.Contract(negativeToken, ["function balanceOf(address) external view returns (uint256)"], provider);
                            const [positiveTokenBalance, negativeTokenBalance] = await Promise.all([
                                positiveTokenContract.balanceOf(address),
                                negativeTokenContract.balanceOf(address)
                            ]);
                            fetchData.balance = `positive: ${ethers.utils.formatEther(positiveTokenBalance)} / negative: ${ethers.utils.formatEther(negativeTokenBalance)}`
                        }
                        return {
                            ...fetchData,
                            balance: ethers.utils.formatEther(balance)
                        };
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
        }
        getUserWalletAddress();
    }, [wallet]);

    return (
        <>
            <Header />
            <UserTokenList userTokenList={userTokenList} />
        </>
    )
}

function Header() {
    return (
        <header className="w-full">
        <div className="max-w-[80%] mx-auto">
          <div className="py-1">
            <h1 className={`text-center text-[54px] font-[600] text-black ${ibmPlexSerif.className}`}>
              Scoop Times
            </h1>
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between py-3 relative">
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <input
                  className={`h-8 w-full rounded-full bg-neutral-100 pl-9 pr-4 text-sm outline-none ${ibmPlexSans.className}`}
                  placeholder="search"
                  type="search"
                />
              </div>
              <nav className="flex items-center space-x-6 text-black absolute left-1/2 transform -translate-x-1/2">
                <Link className={`text-sm hover:text-neutral-600 ${ibmPlexSerif.className}`} href="#">all</Link>
                <Link className={`text-sm hover:text-neutral-600 ${ibmPlexSerif.className}`} href="#">Crypto</Link>
                <Link className={`text-sm hover:text-neutral-600 ${ibmPlexSerif.className}`} href="#">politics</Link>
                <Link className={`text-sm hover:text-neutral-600 ${ibmPlexSerif.className}`} href="#">sports</Link>
                <Link className={`text-sm hover:text-neutral-600 ${ibmPlexSerif.className}`} href="#">tech</Link>
              </nav>
              <Button
                className="flex items-center gap-0 p-0 text-black hover:text-neutral-600"
                variant="ghost"
                onClick={() => {/* Add your modal open logic here */}}
              >
                <span className="pl-4">[</span>
                <Image
                  src="/fire.gif"
                  alt="Fire icon"
                  width={30}
                  height={30}
                  className="mx-0"
                />
                <span className="pr-4">create new topic]</span>
              </Button>
            </div>
            <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-neutral-200" />
            <div className="absolute left-0 right-0 bottom-[-3px] h-[1px] bg-neutral-200" />
          </div>
        </div>
      </header>
    )
}

function UserTokenList({ userTokenList }: { userTokenList: DisplayData[] }) {
  const handleClaim = (tokenSymbol: string) => {
    console.log(`Claiming rewards for ${tokenSymbol}`);
    // Implement claim logic here
  };

  return (
    <div className="w-full max-w-[80%] mx-auto mt-8 overflow-hidden">
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