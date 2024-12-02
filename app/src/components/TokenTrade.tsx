import { useState, useEffect, useCallback } from 'react'
import { ethers, BigNumber } from 'ethers'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import AdvancedTradingChart from "@/components/Chart"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { calcMarketcap, UniswapV2Service } from "@/lib/UniswapRouter"
import saleArtifact from "../EtherfunSale.json"
import factoryArtifact from "../EtherFunFactory.json"
import { useRouter } from 'next/router'
import useMetaMaskWallet, { useSignerStore } from '@/lib/walletConnector'
import { cn } from "@/lib/utils"
import { Progress } from '@radix-ui/react-progress'
import { useNewsStore } from '@/lib/NewsState'
import { SaleData } from '@/types'

const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c"
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65")

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function TokenTradeSkeleton() {
  return (
    <div className="bg-white ml-[20px] flex flex-col shadow-[0px_4px_36px_0px_rgba(0,0,0,0.09)] p-4 rounded-[20px] space-y-6 w-[30%] h-[45%] max-w-[550px] relative">
      <div className="relative w-full max-h-[545px] aspect-[16/9] border border-[#cdcdcd] rounded-[20px] overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full" />
      </div>
      <div className="space-y-2 relative z-10">
        <Tabs defaultValue="buy">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          <TabsContent value="buy" className="space-y-4">
            <Tabs defaultValue="positive">
              <TabsList>
                <TabsTrigger value="positive">Positive</TabsTrigger>
                <TabsTrigger value="negative">Negative</TabsTrigger>
              </TabsList>
              <TabsContent value="positive">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-14 w-full rounded-full" />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
        <Skeleton className="h-12 w-[90%] mx-auto mt-2 rounded-[20px]" />
      </div>
      
      <div className="absolute bottom-[-40px] left-2 right-2 flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

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
  const {connectWallet} = useMetaMaskWallet(false);
  const wallet = useSignerStore(state => state.signer);
  const news = useNewsStore((state) => state.news)
  const [progressPercentage, setProgressPercentage] = useState(0)
  const [amount, setAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('buy')
  const [activePosition, setActivePosition] = useState<'positive' | 'negative'>('positive')
  const [ethBalance, setEthBalance] = useState('0')
  const [currentNews, setCurrentNews] = useState<SaleData | null>(null)
  const [balance, setBalance] = useState('0')
  const [positiveTokenBalance, setPositiveTokenBalance] = useState('0')
  const [negativeTokenBalance, setNegativeTokenBalance] = useState('0')
  const [positiveMarketcap, setPositiveMarketcap] = useState(0)
  const [negativeMarketcap, setNegativeMarketcap] = useState(0)
  const [isMarketCapLoading, setIsMarketCapLoading] = useState(true)
  const [quickAmounts] = useState([0.001, 0.1, 1])

  const { toast } = useToast();
  const router = useRouter();
  const address = router.query.address as string;

  const ethThreshold = ethers.utils.parseEther("1.5")

  const fetchData = async () => {
    if (!address) return;

    try {
      const sale = news.find(sale => sale.saleContractAddress === address)
      setCurrentNews(sale || null)
      const totalRaisedBN = sale?.totalRaised ? ethers.BigNumber.from(sale.totalRaised) : ethers.BigNumber.from(0)
      const percentage = totalRaisedBN.mul(100).div(ethThreshold).toNumber()

      setProgressPercentage(percentage)

    } catch (error) {
      console.error("Error fetching currentNews data:", error)
    }
  }

  const fetchWalletData = useCallback(async () => {
    if (!address || !wallet || !currentNews) return;
    console.log("🔥TokenTrade.tsx: fetchWalletData")
    setIsMarketCapLoading(true)
    try {
      const saleContract = new ethers.Contract(address, saleArtifact.abi, provider)
      const walletAddress = await wallet.getAddress()

      const erc20Positive = new ethers.Contract(
        currentNews.positiveToken,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      )

      const erc20Negative = new ethers.Contract(
        currentNews.negativeToken,
        ["function balanceOf(address) view returns (uint256)"],
        provider
      )

      const [_balance, _walletEthBalance, _positiveBalance, _negativeBalance, _positiveMarketcap, _negativeMarketcap] = await Promise.all([
          saleContract.tokenBalances(walletAddress),
          provider.getBalance(walletAddress),
          currentNews.launched ? erc20Positive.balanceOf(walletAddress) : ethers.BigNumber.from(0),
          currentNews.launched ? erc20Negative.balanceOf(walletAddress) : ethers.BigNumber.from(0),
          currentNews.launched ? calcMarketcap(currentNews.positiveToken, provider) : 0,
          currentNews.launched ? calcMarketcap(currentNews.negativeToken, provider) : 0
      ])

      console.log("TokenTrade.tsx: _positiveBalance", _positiveBalance)
      console.log("TokenTrade.tsx: _negativeBalance", _negativeBalance)
      console.log("TokenTrade.tsx: _positiveMarketcap", _positiveMarketcap)
      console.log("TokenTrade.tsx: _negativeMarketcap", _negativeMarketcap)

      setPositiveTokenBalance(ethers.utils.formatEther(_positiveBalance))
      setNegativeTokenBalance(ethers.utils.formatEther(_negativeBalance))
      setPositiveMarketcap(_positiveMarketcap)
      setNegativeMarketcap(_negativeMarketcap)
      setBalance(_balance.toString())
      setEthBalance(ethers.utils.formatEther(_walletEthBalance))
      setIsMarketCapLoading(false)
    } catch (error) {
      console.error("Error fetching wallet data:", error)
      setIsMarketCapLoading(false)
    }
  }, [address, wallet, currentNews])

  useEffect(() => {
    if (address && !currentNews) {
      fetchData().then(() => setIsLoading(false))
    }
  }, [address, fetchData])

  useEffect(() => {
    if (wallet) {
      fetchWalletData()
    }
  }, [wallet, currentNews, fetchWalletData])

  useEffect(() => {
    console.log("TokenTrade.tsx: activeTab", activeTab)
    setAmount(0)
  }, [activeTab, activePosition])

  const handleBuySell = async () => {
    if (!currentNews?.saleContractAddress || !amount || !wallet) return
    console.log("🔥TokenTrade.tsx: handleBuySell")
    setIsLoading(true)
    setIsMarketCapLoading(true)

    try {
      let txHash
      if (currentNews.launched) {
        const tokenAddress = activePosition === 'positive' ? currentNews.positiveToken : currentNews.negativeToken
        txHash = activeTab === 'buy'
          ? await buyInUniswap(tokenAddress, ethers.utils.parseEther(amount.toString()), wallet)
          : await sellInUniswap(tokenAddress, ethers.utils.parseEther(amount.toString()), wallet)
      } else {
        txHash = activeTab === 'buy'
          ? await buyToken(currentNews.saleContractAddress, amount.toString(), activePosition, wallet)
          : await sellToken(currentNews.saleContractAddress, amount.toString(), wallet)
      }
      await Promise.all([fetchData(), fetchWalletData()])
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
      console.log("🔥TokenTrade.tsx: handleBuySell: finally")
      setIsLoading(false)
      setIsMarketCapLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!currentNews?.saleContractAddress || !wallet) return
    setIsLoading(true)
    try {
      const txHash = await claimTokens(currentNews.saleContractAddress, wallet)
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

  if (isLoading) return <TokenTradeSkeleton />
  if (!currentNews) return null

  const totalMarketcap = positiveMarketcap + negativeMarketcap
  const positivePercentage = totalMarketcap > 0 ? (positiveMarketcap / totalMarketcap) * 100 : 50
  const negativePercentage = 100 - positivePercentage

  return (
    <div className="bg-white ml-[20px] flex flex-col shadow-[0px_4px_36px_0px_rgba(0,0,0,0.09)] p-4 rounded-[20px] space-y-6 w-[30%] h-[45%] max-w-[550px] relative">
      <div className="relative w-full max-h-[545px] aspect-[16/9] border border-[#cdcdcd] rounded-[20px] overflow-hidden" >
        <div className="absolute inset-0 w-full h-full">
          <AdvancedTradingChart contractAddress={currentNews?.saleContractAddress || ""} />
        </div>
      </div>
      <div className="space-y-2 relative z-10">
        {currentNews?.launched ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy">Buy</TabsTrigger>
                <TabsTrigger value="sell">Sell</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="buy" className="space-y-4">
              <Tabs defaultValue="positive" onValueChange={(value) => setActivePosition(value as 'positive' | 'negative')}>
                <TabsList className="w-full mb-2">
                  <TabsTrigger className="flex-1 border-[#ff24247e] text-[10px]" value="positive">Positive</TabsTrigger>
                  <TabsTrigger className="flex-1 border-[#2929ff97] text-[10px]" value="negative">Negative</TabsTrigger>
                </TabsList>
                <div className="mb-4">
                  <Label className="text-xs text-gray-500 mb-1 block">Positive/Negative Market Cap Ratio</Label>
                  <div className="flex items-center">
                    {isMarketCapLoading ? (
                      <Skeleton className="h-4 w-full rounded-full" />
                    ) : (
                      <>
                        <div className="flex-grow h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div className="flex h-full">
                            <div
                              className="h-full bg-red-500 transition-all duration-300 ease-in-out"
                              style={{ width: `${positivePercentage}%` }}
                              role="progressbar"
                              aria-valuenow={positivePercentage}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                            <div
                              className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                              style={{ width: `${negativePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs ml-2">{`${positivePercentage.toFixed(1)}/${negativePercentage.toFixed(1)}`}</span>
                      </>
                    )}
                  </div>
                </div>
                <TabsContent value="positive">
                  <Label className="text-base text-[10px] text-black font-thin">pay eth</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {quickAmounts.map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {quickAmount}
                      </Button>
                    ))}
                  </div>
                  <Input 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    type="number" 
                    className="h-14 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 border-[#ff24247e]"
                  />
                </TabsContent>
                <TabsContent value="negative">
                  <Label className="text-base text-[10px] text-black font-thin">pay eth</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {quickAmounts.map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {quickAmount}
                      </Button>
                    ))}
                  </div>
                  <Input 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    type="number" 
                    className="h-14 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 border-[#2929ff97]"
                  />
                </TabsContent>
              </Tabs>
            </TabsContent>
          
            <TabsContent value="sell" className="space-y-4">
              <Tabs defaultValue="positive" onValueChange={(value) => setActivePosition(value as 'positive' | 'negative')}>
                <TabsList className="w-full mb-2">
                  <TabsTrigger className="flex-1 border-[#ff24247e] text-[10px]" value="positive">Positive</TabsTrigger>
                  <TabsTrigger className="flex-1 border-[#2929ff97] text-[10px]" value="negative">Negative</TabsTrigger>
                </TabsList>
                <div className="mb-4">
                  <Label className="text-xs text-gray-500 mb-1 block">Positive/Negative Market Cap Ratio</Label>
                  <div className="flex items-center">
                    {isMarketCapLoading ? (
                      <Skeleton className="h-4 w-full rounded-full" />
                    ) : (
                      <>
                        <div className="flex-grow h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div className="flex h-full">
                            <div
                              className="h-full bg-red-500 transition-all duration-300 ease-in-out"
                              style={{ width: `${positivePercentage}%` }}
                              role="progressbar"
                              aria-valuenow={positivePercentage}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            ></div>
                            <div
                              className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                              style={{ width: `${negativePercentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs ml-2">{`${positivePercentage.toFixed(1)}/${negativePercentage.toFixed(1)}`}</span>
                      </>
                    )}
                  </div>
                </div>
                <TabsContent value="positive">
                  <Label className="text-base text-[10px] text-black font-thin">sell amount</Label>
                  <Input 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    type="number" 
                    className="h-14 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 border-[#ff24247e]"
                  />
                </TabsContent>
                <TabsContent value="negative">
                  <Label className="text-base text-[10px] text-black font-thin">sell amount</Label>
                  <Input 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    type="number" 
                    className="h-14 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 border-[#2929ff97]"
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
                {ethers.utils.formatEther(currentNews?.totalRaised || '0')} ETH raised out of 1.5 ETH threshold
              </p>
              <div className="space-y-2">
                <Label className="text-base text-[14px] font-normal text-black">amount {activeTab === 'buy' ? 'eth' : currentNews?.symbol}</Label>
                {activeTab === 'buy' && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {quickAmounts.map((quickAmount) => (
                      <Button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {quickAmount}
                      </Button>
                    ))}
                  </div>
                )}
                <Input 
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  type="number" 
                  className="h-14 rounded-full mt-0 text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 focus-visible:border-[#E5E5E5]"
                />
              </div>
            </div>
          </Tabs>
        )}
      
        {wallet ? (
          <Button 
            onClick={handleBuySell}
            className={`
              ml-[14px] items-center w-[90%] h-12 mt-2 mb-[10px] rounded-[20px] 
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
             currentNews?.launched 
              ? activeTab === 'buy' ? `pay ${amount} ETH / get ${currentNews.symbol} (${activePosition})` : `selling ${amount} ${currentNews.symbol} (${activePosition})`
              : activeTab === 'buy' ? `pay ${amount} ETH / get ${currentNews.symbol}` : `selling ${amount} ${currentNews.symbol}`
            }
            {isSuccess && (
              <span className="ml-2 animate-ping">🎉</span>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => connectWallet()}
            className="ml-[14px] items-center w-[90%] h-12 mt-2 mb-[10px] rounded-[20px] bg-blue-500 hover:bg-blue-600 text-white"
          >
            Connect Wallet
          </Button>
        )}

        {currentNews?.launched && ethers.BigNumber.from(balance).gt(0) && (
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
        {currentNews?.launched && (
          <>
            <span className="flex-1">{`${currentNews.symbol} (positive)`}: {parseFloat(positiveTokenBalance).toFixed(3)}</span>
            <span className="flex-1">{`${currentNews.symbol} (negative)`}: {parseFloat(negativeTokenBalance).toFixed(3)}</span>
          </>
        )}
        {!currentNews?.launched && (
          <span className="flex-1">{ethers.utils.formatEther(balance)}</span>
        )}
      </div>
    </div>
  )
}

