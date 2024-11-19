'use client'

import { useState, useEffect } from 'react'
import { ethers, BigNumber } from 'ethers'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import AdvancedTradingChart from "@/components/ui/Chart"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniswapV2Service } from "@/lib/UniswapRouter"
import saleArtifact from "../EtherfunSale.json"
import factoryArtifact from "../EtherFunFactory.json"
import { useRouter } from 'next/router'
import { useSignerStore } from '@/lib/walletConnector'
import { Toast } from '@radix-ui/react-toast'

const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c"
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65")

interface ArticleDisplay {
  address: string
  name: string
  symbol: string
  metadata: {
    creator: string
    saleGoal: string
    logoUrl: string
    websiteUrl: string
    twitterUrl: string
    telegramUrl: string
    description: string
    relatedLinks: string[]
  }
  totalRaised: string
  launched: boolean
  balance: string
  positiveToken: string
  negativeToken: string
  positiveTokenBalance?: string
  negativeTokenBalance?: string
}

// ブロックチェーン関連の関数
async function buyToken(saleAddress: string, amount: string, position: 'positive' | 'negative', wallet: ethers.Signer) {
  const factoryContract = new ethers.Contract(factoryAddress, factoryArtifact.abi, wallet)
  const tx = await factoryContract.buyToken(saleAddress, position === 'positive' ? 0 : 1, "", {
    value: ethers.utils.parseEther(amount)
  })
  const receipt = await tx.wait()
  return receipt.transactionHash
}

async function sellToken(saleAddress: string, amount: string, wallet: ethers.Signer) {
  const factoryContract = new ethers.Contract(factoryAddress, factoryArtifact.abi, wallet)
  const tx = await factoryContract.sellToken(saleAddress, ethers.utils.parseEther(amount), 0)
  const receipt = await tx.wait()
  return receipt.transactionHash
}

async function buyInUniswap(tokenAddress: string, amount: BigNumber, wallet: ethers.Signer) {
  const uniswap = new UniswapV2Service({
    provider,
    signer: wallet
  })
  const { output, txHash } = await uniswap.swapETHForTokens(tokenAddress, amount, 0.5)
  return txHash
}

async function sellInUniswap(tokenAddress: string, amount: BigNumber, wallet: ethers.Signer) {
  const uniswap = new UniswapV2Service({
    provider,
    signer: wallet
  })
  const { output, txHash } = await uniswap.swapTokensForETH(tokenAddress, amount, 0.5)
  return txHash
}

async function claimTokens(saleAddress: string, wallet: ethers.Signer) {
  const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, wallet)
  const tx = await factory.claim(saleAddress)
  const receipt = await tx.wait()
  return receipt.transactionHash
}

export default function TokenTrade() {
  const wallet = useSignerStore(state => state.signer);
  const [article, setArticle] = useState<ArticleDisplay | null>(null)
  const [progressPercentage, setProgressPercentage] = useState(0)
  const [amount, setAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('buy')
  const [activePosition, setActivePosition] = useState<'positive' | 'negative'>('positive')
  const [ethBalance, setEthBalance] = useState('0')
  const { toast } = useToast();
  const router = useRouter();
  const address = router.query.address as string;

  const ethThreshold = ethers.utils.parseEther("1.5")

  const fetchData = async () => {
    if (address) {
      const factoryContract = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider)
      const saleContract = new ethers.Contract(address, saleArtifact.abi, provider)
      
      const [
        name,
        symbol,
        metadata,
        totalRaised,
        launched,
        positiveToken,
        negativeToken,
      ] = await Promise.all([
        saleContract.name(),
        saleContract.symbol(),
        factoryContract.getSaleMetadata(address),
        saleContract.totalRaised(),
        saleContract.launched(),
        saleContract.positiveToken(),
        saleContract.negativeToken(),
      ])

      const totalRaisedBN = totalRaised ? ethers.BigNumber.from(totalRaised) : ethers.BigNumber.from(0)
      const percentage = totalRaisedBN.mul(100).div(ethThreshold).toNumber()
      setProgressPercentage(percentage)

      setArticle({
        address,
        name,
        symbol,
        metadata,
        totalRaised: totalRaisedBN.toString(),
        launched,
        balance: "0",
        positiveToken,
        negativeToken,
        positiveTokenBalance: "0",
        negativeTokenBalance: "0"
      })
    }
  }

  useEffect(() => {
    fetchData()
  }, [router.query.address])

  useEffect(() => {
    const fetchWalletData = async () => {
      if (address && wallet && article) {
        const saleContract = new ethers.Contract(address, saleArtifact.abi, provider)
        const walletAddress = await wallet.getAddress()

        const [balance, walletEthBalance] = await Promise.all([
          saleContract.tokenBalances(walletAddress),
          provider.getBalance(walletAddress)
        ])

        let positiveTokenBalance = "0"
        let negativeTokenBalance = "0"

        if (article.positiveToken !== ethers.constants.AddressZero) {
          const erc20Positive = new ethers.Contract(
            article.positiveToken,
            ["function balanceOf(address) view returns (uint256)"],
            provider
          )
          const erc20Negative = new ethers.Contract(
            article.negativeToken,
            ["function balanceOf(address) view returns (uint256)"],
            provider
          )

          const [_positiveBalance, _negativeBalance] = await Promise.all([
            erc20Positive.balanceOf(walletAddress),
            erc20Negative.balanceOf(walletAddress)
          ])

          positiveTokenBalance = ethers.utils.formatEther(_positiveBalance)
          negativeTokenBalance = ethers.utils.formatEther(_negativeBalance)
        }

        setEthBalance(ethers.utils.formatEther(walletEthBalance))
        setArticle(prev => prev ? {
          ...prev,
          balance: balance.toString(),
          positiveTokenBalance,
          negativeTokenBalance
        } : null)
      }
    }

    fetchWalletData()
  }, [address, wallet, article])

  const handleBuySell = async () => {
    if (!article?.address || !amount || !wallet) return

    setIsLoading(true)
    try {
      let txHash
      if (article.launched) {
        const tokenAddress = activePosition === 'positive' ? article.positiveToken : article.negativeToken
        txHash = activeTab === 'buy'
          ? await buyInUniswap(tokenAddress, ethers.utils.parseEther(amount.toString()), wallet)
          : await sellInUniswap(tokenAddress, ethers.utils.parseEther(amount.toString()), wallet)
      } else {
        txHash = activeTab === 'buy'
          ? await buyToken(article.address, amount.toString(), activePosition, wallet)
          : await sellToken(article.address, amount.toString(), wallet)
      }
      
      await fetchData()
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 3000) // Reset success state after 3 seconds
    } catch (error) {
      console.error(`Error ${activeTab === 'buy' ? 'buying' : 'selling'} token:`, error)
      toast({
        title: `Token ${activeTab === 'buy' ? 'Purchase' : 'Sale'} Failed`,
        description: "An error occurred during the transaction.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!article?.address || !wallet) return
    setIsLoading(true)
    try {
      const txHash = await claimTokens(article.address, wallet)
      await fetchData()
      toast({
        title: "Tokens Claimed Successfully",
        description: `Transaction Hash: ${txHash}`,
      })
    } catch (error) {
      console.error("Error claiming tokens:", error)
      toast({
        title: "Token Claim Failed",
        description: "An error occurred during the claim.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!article) return <div>Loading...</div>

  return (
    <div className="bg-white ml-[20px] flex flex-col shadow-[0px_4px_36px_0px_rgba(0,0,0,0.09)] p-4 rounded-[20px] space-y-6 w-[30%] h-[45%] max-w-[550px] relative">
      <div className="relative w-full max-h-[545px] aspect-[16/9] border border-[#cdcdcd] rounded-[20px] overflow-hidden" >
        <div className="absolute inset-0 w-full h-full">
          <AdvancedTradingChart />
        </div>
      </div>
      <div className="space-y-2 relative z-10">
        {article.launched ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="buy" className="space-y-4">
              <Tabs defaultValue="positive" onValueChange={(value) => setActivePosition(value as 'positive' | 'negative')}>
                <TabsList>
                  <TabsTrigger className="border-[#ff24247e] text-[10px]" value="positive">Positive</TabsTrigger>
                  <TabsTrigger className="border-[#2929ff97] text-[10px]" value="negative">Negative</TabsTrigger>
                </TabsList>
                <TabsContent value="positive">
                  <Label className="text-base text-[10px] text-black font-thin">pay eth</Label>
                  <Input 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    type="number" 
                    defaultValue="0" 
                    className="h-14 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 border-[#ff24247e]"
                  />
                </TabsContent>
                <TabsContent value="negative">
                  <Label className="text-base text-[10px] text-black font-thin">pay eth</Label>
                  <Input 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    type="number" 
                    defaultValue="0" 
                    className="h-14 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 border-[#2929ff97]"
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="sell" className="space-y-4">
              <Tabs defaultValue="positive" onValueChange={(value) => setActivePosition(value as 'positive' | 'negative')}>
                <TabsList>
                  <TabsTrigger className="border-[#ff24247e] text-[10px]" value="positive">Positive</TabsTrigger>
                  <TabsTrigger className="border-[#2929ff97] text-[10px]" value="negative">Negative</TabsTrigger>
                </TabsList>
                <TabsContent value="positive">
                  <Label className="text-base text-[10px] text-black font-thin">pay eth</Label>
                  <Input 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    type="number" 
                    defaultValue="0" 
                    className="h-14 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 border-[#ff24247e]"
                  />
                </TabsContent>
                <TabsContent value="negative">
                  <Label className="text-base text-[10px] text-black font-thin">pay eth</Label>
                  <Input 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    type="number" 
                    defaultValue="0" 
                    className="h-12 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 border-[#2929ff97]"
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>
            <div className="bg-[#ffffff] p-3 rounded-xl space-y-2">
              <p className="text-[#000000] text-[14px]">
                bonding curve progress: {progressPercentage}%
              </p>
              <div className="h-8 bg-[#f2f2f2] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00ff48] rounded-full transition-all duration-300 ease-in-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-sm font-thin text-[#6b6b6b]">
                {ethers.utils.formatEther(article.totalRaised)} ETH raised out of {ethers.utils.formatEther(ethThreshold)} ETH threshold
              </p>
              <div className="space-y-2">
                <Label className="text-base text-[14px] font-normal text-black">amount {activeTab === 'buy' ? 'eth' : article.symbol}</Label>
                <Input 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  type="number" 
                  defaultValue="0" 
                  className="h-14 rounded-full mt-0 text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 focus-visible:border-[#E5E5E5]"
                />
              </div>
            </div>
          </Tabs>
        )}
        <Button 
          onClick={handleBuySell}
          className={`
            ml-[14px] items-center w-[90%] h-14 mt-2 mb-[10px] rounded-[10px] 
            ${isSuccess 
              ? "bg-green-500 hover:bg-green-600 text-white" 
              : amount > 0 
                ? "text-white bg-black" 
                : "bg-[#F3F3F3] hover:bg-[#E5E5E5] text-[#8F8F8F]"
            }
            transition-all duration-300 ease-in-out
          `}
          variant="ghost"
          disabled={amount <= 0 || isLoading}
        >
          {isLoading ? 'Processing...' : 
           isSuccess ? 'Purchase Successful!' :
           article.launched 
            ? `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${article.symbol}`
            : `Purchase ${activePosition}`
          }
          {isSuccess && (
            <span className="ml-2 animate-ping">🎉</span>
          )}
        </Button>

        {article.launched && ethers.BigNumber.from(article.balance).gt(0) && (
          <Button 
            onClick={handleClaim}
            className="ml-[14px] w-[90%] h-8 rounded-[10px] bg-red-500 hover:bg-red-600 text-white animate-pulse"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Claim Tokens'}
          </Button>
        )}
      </div>
      
      <div className="absolute bottom-[-40px] left-2 right-2 flex items-center justify-between text-[12px] font-thin text-gray-500">
        <span className="flex-1">ETH Balance: {parseFloat(ethBalance).toFixed(3)} ETH</span>
        {article.launched && (
          <>
            <span className="flex-1">{`${article.symbol} (positive)`}: {parseFloat(article.positiveTokenBalance || "0").toFixed(3)}</span>
            <span className="flex-1">{`${article.symbol} (negative)`}: {parseFloat(article.negativeTokenBalance || "0").toFixed(3)}</span>
          </>
        )}
        {!article.launched && (
          <span className="flex-1">{ethers.utils.formatEther(article.balance)}</span>
        )}
      </div>
    </div>
  )
}