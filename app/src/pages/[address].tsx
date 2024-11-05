//@ts-nocheck
'use client'

import Image from "next/image"
import Link from "next/link"
import { Globe, Star, Heart, ArrowBigUp, ArrowBigDown } from "lucide-react"
import { IBM_Plex_Serif } from 'next/font/google'
import { useEffect, useState } from 'react'
import saleArtifact from "../EtherfunSale.json"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/router"
import { BigNumber, ethers } from "ethers"
import factoryArtifact from "../EtherFunFactory.json"
import artic from "../EtherFunFactory.json"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { ColorType, createChart } from "lightweight-charts"
import AdvancedTradingChart from "@/components/ui/Chart"
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/toaster"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UniswapV2Service } from "@/lib/UniswapRouter"

const testPrivateKey = "68bf6ec02461aecaa2d401ff255a39dc1f97a23f4755837b0a06391513101846";
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");
// const testWallet = new ethers.Wallet(testPrivateKey, provider);
const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c";

const ibmPlexSerif = IBM_Plex_Serif({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const ethThreshold = ethers.utils.parseEther("1.5")

interface Comment {
  id: number
  text: string
  image?: string
  positive: number
  negative: number
}

interface SaleMetadata {
  creator: string
  saleGoal: string
  logoUrl: string
  websiteUrl: string
  twitterUrl: string
  telegramUrl: string
  description: string
  relatedLinks: string[]
}

interface ArticleDisplay {
  address: string
  name: string
  symbol: string
  metadata: SaleMetadata
  totalRaised: string
  launched: boolean,
  balance: string
  positiveToken: string
  negativeToken: string,
  positiveTokenBalance?: string,
  negativeTokenBalance?: string
  relatedLinks: string[]
}

function CommentCard({ comment, onVote, article }: { comment: Comment, onVote: (id: number, type: 'positive' | 'negative') => void, article: ArticleDisplay | null }) {
  return (
    <div className="bg-white p-4">
      <div className="flex items-start space-x-2">
        <Avatar className="w-10 h-10">
          <AvatarImage src={`https://api.dicebear.com/6.x/identicon/svg?seed=${comment.id}`} />
          <AvatarFallback>A</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
          {comment.image && (
            <img src={comment.image} alt="Comment attachment" className="max-w-full h-auto rounded" />
          )}
          <div className="mt-2 text-sm text-black">
            Token Balance: {ethers.utils.formatEther(article?.balance || '0')} {article?.symbol}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Component({ wallet }: { wallet: ethers.Signer | null }) {
  const testWallet = wallet
  
  // console.log("testWallet", await testWallet.getAddress())
  const [activePosition, setActivePosition] = useState<'positive' | 'negative'>('positive')
  const router = useRouter()
  const { address } = router.query
  const [article, setArticle] = useState<ArticleDisplay | null>(null)
  const [progressPercentage, setProgressPercentage] = useState(0)
  const [amount, setAmount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      text: "We've spent two years examining the implications of a second Donald Trump presidency. He wants to radically reshape the federal government and consolidate executive power. He tried to do much of this in his first term but was largely stymied. Now, he's intent on hiring people less likely to say no.",
      positive: 10,
      negative: 40,
    },
    {
      id: 2,
      text: "We've spent two years examining the implications of a second Donald Trump presidency. He wants to radically reshape the federal government and consolidate executive power. He tried to do much of this in his first term but was largely stymied. Now, he's intent on hiring people less likely to say no.",
      image: "/placeholder.svg?height=200&width=300",
      positive: 10,
      negative: 40,
    }
  ])
  const [newComment, setNewComment] = useState('')
  const [ethBalance, setEthBalance] = useState('0')
  const [activeTab, setActiveTab] = useState('buy')

  const fetchData = async () => {
    if (address) {
      const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65")
      const factoryContract = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider)
      const saleContract = new ethers.Contract(address as string, saleArtifact.abi, provider)
      setEthBalance(ethers.utils.formatEther(await provider.getBalance(await testWallet.getAddress())))
      const [name, symbol, metadata, totalRaised, launched, balance, positiveToken, negativeToken] = await Promise.all([
        saleContract.name(),
        saleContract.symbol(),
        factoryContract.getSaleMetadata(address as string),
        saleContract.totalRaised(),
        saleContract.launched(),
        saleContract.tokenBalances(await testWallet.getAddress()),
        saleContract.positiveToken(),
        saleContract.negativeToken()
      ])
      let positiveTokenBalance;
      let negativeTokenBalance;
      console.log("positiveToken", positiveToken)
      if(positiveToken != ethers.constants.AddressZero) {
        console.log("positiveToken not zero")
        const erc20Positive = new ethers.Contract(positiveToken, ["function balanceOf(address) view returns (uint256)"], provider)
        const erc20Negative = new ethers.Contract(negativeToken, ["function balanceOf(address) view returns (uint256)"], provider)
        let [_positiveTokenBalance, _negativeTokenBalance] = await Promise.all([
          erc20Positive.balanceOf(await testWallet.getAddress()),
          erc20Negative.balanceOf(await testWallet.getAddress())
        ])
        positiveTokenBalance = ethers.utils.formatEther(_positiveTokenBalance)
        negativeTokenBalance = ethers.utils.formatEther(_negativeTokenBalance)
      }

      console.log("!!relatedLinks", metadata.relatedLinks)

      
      const totalRaisedBN = totalRaised ? ethers.BigNumber.from(totalRaised) : ethers.BigNumber.from(0)
      const percentage = totalRaisedBN.mul(100).div(ethThreshold).toNumber()
      setProgressPercentage(percentage)

      setArticle({
        address: address as string,
        name,
        symbol,
        metadata,
        totalRaised: totalRaisedBN.toString(),
        launched,
        balance: balance.toString(),
        positiveToken,
        negativeToken,
        positiveTokenBalance,
        negativeTokenBalance,
        relatedLinks: [...metadata.relatedLinks]
      })
    }
  }

  useEffect(() => {
    console.log("address", address)
    fetchData()
  }, [address])

  const handleBuySell = async () => {
    if (!article?.address || !amount) return

    setIsLoading(true)
    try {
      const txHash = activeTab === 'buy' ? await buyToken(article.address, amount.toString(), activePosition, testWallet) : await sellToken(article.address, amount.toString(), testWallet)
      
      await fetchData();
      toast({
        title: `Token Purchase Successful`,
        description: `Transaction Hash: ${txHash}`,
      })
    } catch (error) {
      console.error(`Error buying token:`, error)
      toast({
        title: `Token Purchase Failed`,
        description: "An error occurred during the transaction.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwap = async () => {
    const tokenAddress = activeTab === 'buy' ? article?.positiveToken : article?.negativeToken
    if (!article?.address || !amount || !tokenAddress || !testWallet) return
    let txHash = ''
    if (activeTab == 'buy') {
      console.log(activeTab, tokenAddress, amount)
      txHash = await buyInUniswap(tokenAddress as string, ethers.utils.parseEther(amount.toString()), testWallet)
    } else {
      txHash = await sellInUniswap(tokenAddress as string, ethers.utils.parseEther(amount.toString()), testWallet)
    }
    await fetchData()
    toast({
      title: `Token ${activeTab === 'buy' ? 'Purchase' : 'Sale'} Successful`,
      description: `Transaction Hash: ${txHash}`,
    })
  }

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      setComments([...comments, {
        id: comments.length + 1,
        text: newComment,
        positive: 0,
        negative: 0
      }])
      setNewComment('')
    }
  }

  const handleVote = (id: number, type: 'positive' | 'negative') => {
    setComments(comments.map(comment => 
      comment.id === id ? {...comment, [type]: comment[type] + 1} : comment
    ))
  }

  if (!article) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Top Section: Article + Purchase Component */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Left Column - Article Content */}
        <div className="space-y-8">
          <article className={`prose prose-gray max-w-none ${ibmPlexSerif.className}`}>
            <h1 className="text-4xl font-bold tracking-tight text-black">
              {article?.name}
            </h1>
            <p className="text-lg text-muted-foreground mt-4 min-h-[100px]">
              {article?.metadata.description}
            </p>
            <div className="flex justify-center my-8">
              <Avatar className="w-80 h-80">
                <AvatarImage
                  src={article?.metadata.logoUrl || ""}
                  alt="Featured image"
                  className="object-cover"
                />
                <AvatarFallback>NT</AvatarFallback>
              </Avatar>
            </div>
          </article>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {article?.relatedLinks.map((link, i) => (
              <Card key={i} className="bg-muted">
                <CardContent className="p-4">
                  <a href={link} className="text-sm font-medium mb-2">
                    {/* {article?.metadata.relatedLinks[i]} */}
                    link
                  </a>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 mr-1" />
                    "link"
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column - Purchase Interface or Bonding Curve Progress */}
        <div className="bg-white shadow-[0px_4px_36px_0px_rgba(0,0,0,0.09)] p-6 rounded-[20px] space-y-6 max-w-[600px] relative">
          <div className="relative w-full aspect-[16/9] border border-[#cdcdcd] rounded-[20px] overflow-hidden" >
            <div className="absolute inset-0 w-full h-full">
              <AdvancedTradingChart width="100%" height="100%" />
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            {article && article.launched ? (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>
                
                <TabsContent value="buy" className="space-y-4">
                  <Label className="text-base font-normal text-black">amount eth</Label>
                  <Input 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    type="number" 
                    defaultValue="0" 
                    className="h-14 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 focus-visible:border-[#E5E5E5]"
                  />
                  <RadioGroup defaultValue="positive" onValueChange={(value) => setActivePosition(value as 'positive' | 'negative')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="positive" id="positive" />
                      <Label htmlFor="positive">Positive</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="negative" id="negative" />
                      <Label htmlFor="negative">Negative</Label>
                    </div>
                  </RadioGroup>
                </TabsContent>

                <TabsContent value="sell" className="space-y-4">
                  <Label className="text-base font-normal text-black">amount {article.symbol}</Label>
                  <Input 
                    onChange={(e) => setAmount(Number(e.target.value))}
                    type="number" 
                    defaultValue="0" 
                    className="h-14 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 focus-visible:border-[#E5E5E5]"
                  />
                  <RadioGroup defaultValue="positive" onValueChange={(value) => setActivePosition(value as 'positive' | 'negative')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="positive" id="positive" />
                      <Label htmlFor="positive">Positive</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="negative" id="negative" />
                      <Label htmlFor="negative">Negative</Label>
                    </div>
                  </RadioGroup>
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
                    <Label className="text-base font-normal text-black">amount {activeTab === 'buy' ? 'eth' : article.symbol}</Label>
                    <Input 
                      onChange={(e) => setAmount(Number(e.target.value))}
                      type="number" 
                      defaultValue="0" 
                      className="h-14 rounded-full text-center text-[24px] border-[#F3F3F3] text-black focus-visible:ring-0 focus-visible:border-[#E5E5E5]"
                    />
                  </div>
                </div>
              </Tabs>
            )}
            <Button 
              onClick={article?.launched ? handleSwap : handleBuySell}
              className={`w-full h-14 rounded-full bg-[#F3F3F3] hover:bg-[#E5E5E5] text-[#8F8F8F] ${amount > 0 ? "text-white bg-black" : ""}`}
              variant="ghost"
              disabled={amount <= 0 || isLoading}
            >
              {isLoading ? 'Processing...' : article && article.launched 
                ? `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${article.symbol}`
                : `Purchase ${activePosition}`}
            </Button>
            {article && article.launched && ethers.BigNumber.from(article.balance).gt(0) && (
              <Button 
                onClick={async () => {
                  console.log("article.balance", article.balance)
                  console.log("claim", ethers.BigNumber.from(article.balance).gt(0))
                  await claimTokens(article.address, testWallet)
                  await fetchData()
                  toast({
                    title: "Tokens Claimed",
                    description: "You have successfully claimed your tokens.",
                  })
                }}
                className="w-[90%] h-10 rounded-full ml-6 bg-red-500 hover:bg-red-600 text-white animate-pulse"
              >
                Claim Tokens
              </Button>
            )}
          </div>
          
          {/* Balance display section */}
          {article && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[12px] font-thin text-gray-500">
              <span className="flex-1">ETH Balance: {parseFloat(ethBalance).toFixed(3)} ETH</span>
              <span className="flex-1">{`${article.symbol} (positive)`}: {parseFloat(article.positiveTokenBalance || "0").toFixed(3)}</span>
              <span className="flex-1">{`${article.symbol} (negative)`}: {parseFloat(article.negativeTokenBalance || "0").toFixed(3)}</span>
            </div>
          )}
        </div>
      </div>
      {/* Bottom Section: Full-width Comment Area */}
      <div className="w-full max-w-2xl mx-auto">
        <section className="space-y-6">
          <h2 className={`${ibmPlexSerif.className} text-[#424242] text-2xl font-bold`}>
            COMMENTS
          </h2>
          <form onSubmit={handleSubmitComment} className="mb-4">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="mb-2"
            />
            <Button type="submit">Post Comment</Button>
          </form>
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} onVote={handleVote} article={article} />
            ))}
          </div>
        </section>
      </div>
      <Toaster />
    </div>
  )
}

async function buyToken(saleAddress: string, amount: string, position: 'positive' | 'negative', wallet: ethers.Signer) {
  const factoryContract = new ethers.Contract(factoryAddress, 
  factoryArtifact.abi, wallet)
  const tx = await factoryContract.buyToken(saleAddress, position === 'positive' ? 0 : 1, "", {
    value: ethers.utils.parseEther(amount)
  })
  const receipt = await tx.wait()
  console.log("receipt", receipt)
  return receipt.transactionHash;
}

async function sellToken(saleAddress: string, amount: string, wallet: ethers.Signer) {
  const factoryContract = new ethers.Contract(factoryAddress, 
  factoryArtifact.abi, wallet)
  const tx = await factoryContract.sellToken(saleAddress, ethers.utils.parseEther(amount), 0)
  const receipt = await tx.wait()
  console.log("receipt", receipt)
  return receipt.transactionHash;
}

async function sellInUniswap(tokenAddress: string, amount: BigNumber, wallet: ethers.Signer) {
  console.log("buyInUniswap", tokenAddress, amount)
  const oldBalance = await (new ethers.Contract(tokenAddress, ["function balanceOf(address) view returns (uint256)"], provider)).balanceOf(await wallet.getAddress())
  console.log("oldBalance", ethers.utils.formatEther(oldBalance.toString()))
  const uniswap = new UniswapV2Service({
    provider,
    signer: wallet
  })
  const { output, txHash } = await uniswap.swapTokensForETH(tokenAddress, amount, 0.5)
  const newBalance = await (new ethers.Contract(tokenAddress, ["function balanceOf(address) view returns (uint256)"], provider)).balanceOf(await wallet.getAddress())
  console.log("newBalance", ethers.utils.formatEther(newBalance.toString()))
  console.log("diff", ethers.utils.formatEther(newBalance.sub(oldBalance).toString()))
  console.log("output", output)
  return txHash;
}

async function buyInUniswap(tokenAddress: string, amount: BigNumber, wallet: ethers.Signer) {
  const oldBalance = await (new ethers.Contract(tokenAddress, ["function balanceOf(address) view returns (uint256)"], provider)).balanceOf(await wallet.getAddress())
  console.log("oldBalance", ethers.utils.formatEther(oldBalance.toString()))
  const uniswap = new UniswapV2Service({
    provider,
    signer: wallet
  })
  const { output, txHash } = await uniswap.swapETHForTokens(tokenAddress, amount, 0.5)
  console.log("output", output)
  const newBalance = await (new ethers.Contract(tokenAddress, ["function balanceOf(address) view returns (uint256)"], provider)).balanceOf(await wallet.getAddress())
  console.log("newBalance", ethers.utils.formatEther(newBalance.toString()))
  console.log("diff", ethers.utils.formatEther(newBalance.sub(oldBalance).toString()))
  return txHash;
}

async function claimTokens(saleAddress: string, wallet: ethers.Signer) {
  console.log("claimTokens", saleAddress)
  const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, wallet)
  const tx = await factory.claim(saleAddress)
  const receipt = await tx.wait()
  console.log("receipt", receipt)
  return receipt.transactionHash;
}