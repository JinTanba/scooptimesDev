'use client'

import { useState, useEffect } from "react"
import { useNewsStore } from "@/lib/NewsState"
import { IBM_Plex_Serif } from 'next/font/google'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import router, { useRouter } from "next/router"
import { Search } from 'lucide-react'
import Link from 'next/link'
import { BigNumber, ethers } from "ethers"

const ibmPlexSerif = IBM_Plex_Serif({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

interface SaleData {
  id: number
  created_at: string
  saleContractAddress: string
  creator: string
  name: string
  symbol: string
  logoUrl: string
  websiteUrl: string
  twitterUrl: string
  telegramUrl: string
  description: string
  blockNumber?: string
  transactionHash: string
  totalRaised: string
  launched: boolean
  positiveToken: string
  negativeToken: string
  positiveMarketcap?: number
  negativeMarketcap?: number
  positivePairAddress: string
  negativePairAddress: string
}

interface NewsItemProps {
  news: SaleData
  index: number
}

function NewsItem({ news, index }: NewsItemProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const router = useRouter()
  const { 
    saleContractAddress,
    name,
    logoUrl,
    launched,
    positiveMarketcap = 0,
    negativeMarketcap = 0,
    description,
    totalRaised
  } = news

  const totalMarketCap = positiveMarketcap + negativeMarketcap
  const positivePercentage = (positiveMarketcap / totalMarketCap) * 100
  const negativePercentage = (negativeMarketcap / totalMarketCap) * 100

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, index * 100); // Stagger the animation

    return () => clearTimeout(timer);
  }, [index]);

  return (
    <motion.div 
      className="bg-white rounded-[12px] shadow-lg shadow-gray-200/50 border border-gray-100 p-4 h-[190px] w-[calc(100% - 2px)] flex flex-col"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={shouldAnimate ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div 
        className="cursor-pointer flex-grow"
        onClick={() => router.push(`/${saleContractAddress}`)}
      >
        <div className="flex items-start gap-3 mb-2">
          <Avatar className="h-12 w-12 rounded">
            <AvatarImage src={logoUrl} alt={name} className="object-cover" />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {name}
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
              {description.slice(0, 100)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        {launched ? (
          <div className="mb-2">
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-red-300" 
                style={{ width: `${positivePercentage}%` }}
              ></div>
              <div 
                className="h-full bg-blue-300" 
                style={{ width: `${negativePercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Yes: {positivePercentage.toFixed(1)}%</span>
              <span>No: {negativePercentage.toFixed(1)}%</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button 
              variant="outline" 
              className="h-8 text-xs bg-[#e6f7ed] border-[#bae6d2] text-[#18794e] hover:bg-[#d0f0e0] transition-colors"
            >
              Buy Yes ↗
            </Button>
            <Button 
              variant="outline"
              className="h-8 text-xs bg-[#fdf1f0] border-[#f9d0cb] text-[#b42318] hover:bg-[#fce3e0] transition-colors"
            >
              Buy No ↘
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between text-gray-500 text-xs">
          <div>
            {launched 
              ? `Market Cap: $${totalMarketCap?.toLocaleString() || 0}`
              : `${ethers.utils.formatEther(totalRaised || '0')} ETH`
            }
          </div>
          <div>
            {launched ? 'Published' : 'Bonding Curve'}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function Header() {
  return (
    <header className="sticky top-0 bg-white z-10 border-b border-gray-200">
      <div className="max-w-[95vw] mx-auto py-3">
        <div className="flex items-center justify-between">
          <h1 className={`${ibmPlexSerif.className} text-xl font-bold`}>
            Skin in the game
          </h1>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/myPage')}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 h-9"
            >
              My Page
            </Button>
            <Button
              // onClick={() => router.push('/create-topic')}
              className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 hover:from-purple-500 hover:via-pink-600 hover:to-red-600 text-white text-sm px-4 py-2 h-9"
            >
              Create Topic
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

function Navigation({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  return (
    <nav className="">
      <div className="max-w-[85vw] mx-auto py-2 flex items-center space-x-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("trending")}
          className={`${
            activeTab === "trending"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          } px-4 py-1.5 rounded-[10px] text-sm font-medium transition-colors`}
        >
          Trending
        </button>
        <button
          onClick={() => setActiveTab("launched")}
          className={`${
            activeTab === "launched"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          } px-4 py-1.5 rounded-[10px] text-sm font-medium transition-colors`}
        >
          Launched
        </button>
        <div className="relative flex-1 max-w-md ml-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by market"
            className="w-full bg-gray-100 text-sm rounded-full pl-10 pr-4 py-1.5 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </nav>
  )
}

function NewsContainer({ news: _news }: { news: SaleData[] }) {
  const [news, setNews] = useState<SaleData[]>([]);

  useEffect(() => {
    setNews([]);
    setTimeout(() => {
      setNews(_news);
    }, 100);
  }, [_news]);

  if (!news.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No news available
      </div>
    )
  }

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {news.map((item, index) => (
        <NewsItem
          key={`${item.saleContractAddress}-${index}`}
          news={item}
          index={index}
        />
      ))}
    </div>
  )
}

export default function Page() {
  const _news = useNewsStore(state => state.news)
  const [activeTab, setActiveTab] = useState("trending")
  const [filteredNews, setFilteredNews] = useState(_news)

  useEffect(() => {
    console.log('news display', _news);
    const filtered = activeTab === "launched" 
      ? _news.filter(item => item.launched)
      : _news;
    setFilteredNews([]);
    setTimeout(() => {
      setFilteredNews(filtered);
    }, 100);
  }, [activeTab, _news])

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="w-full overflow-x-hidden px-4">
        <div className="max-w-[85vw] mx-auto pt-4">
          <NewsContainer news={filteredNews} />
        </div>
      </div>
    </div>
  )
}

