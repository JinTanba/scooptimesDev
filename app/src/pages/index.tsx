import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Search } from 'lucide-react'
import { IBM_Plex_Serif, IBM_Plex_Sans } from "next/font/google"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import router, { useRouter } from "next/router"
import { ethers } from "ethers"
import { News, SaleData } from "@/types"
import { CreateNewsModal } from "@/components/CreateNews"
import { useEffect, useState } from "react"
import { useNewsStore } from "@/lib/NewsState"
import { useSignerStore } from "@/lib/walletConnector"
import { PieChart } from 'react-minimal-pie-chart'
import { calcMarketcap } from "@/lib/UniswapRouter"

// Font settings
const ibmPlexSerif = IBM_Plex_Serif({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
})

const Content = ({logoUrl, name, blockNumber, creator, description, positiveMarketcap, negativeMarketcap, launched}: {logoUrl: string, name: string, blockNumber: number, creator: string, description: string, positiveMarketcap: number, negativeMarketcap: number, launched: boolean}) => (
  
  <div className="flex gap-4">
    <div className="relative w-[104px] flex-shrink-0 flex flex-col justify-center items-center">
      <Avatar className="w-[90px] h-[90px]">
        <AvatarImage src={logoUrl} alt={name} className="object-cover" />
        <AvatarFallback>NT</AvatarFallback>
      </Avatar>
    </div>
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-start mb-1">
        <h2 className={`text-black font-semibold ${ibmPlexSerif.className}`} style={{ fontSize: '15px' }}>
          {name}
        </h2>
        <span className="text-xs text-neutral-500">{blockNumber}</span>
      </div>
      <div className={`flex items-center gap-2 mb-2 ${ibmPlexSans.className}`}>
        <span className="text-[8px] text-black">created by</span>
        <Avatar className="w-[12px] h-[12px]">
          <AvatarImage src="/news1.webp" alt={`${creator}'s avatar`} />
          <AvatarFallback>{creator[0]}</AvatarFallback>
        </Avatar>
        <span className="text-black text-[8px]">{creator}</span>
      </div>
      <p className={`text-[#424242] mb-auto ${ibmPlexSerif.className}`} style={{ fontSize: '8px' }}>
        {description.slice(0, 100)}
      </p>
      <div className={`flex gap-4 ${ibmPlexSans.className}`} style={{ fontSize: '10px' }}>
        {launched && (
          <>
            <div className="flex items-center gap-1">
              <span className="text-red-500">positive</span>
              <span className="text-red-500">{(positiveMarketcap/(positiveMarketcap+negativeMarketcap)*100)?.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-500">Negative</span>
              <span className="text-blue-500">{(negativeMarketcap/(positiveMarketcap+negativeMarketcap)*100)?.toFixed(2)}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-500">market cap</span>
              <span className="text-green-500">{(positiveMarketcap+negativeMarketcap).toLocaleString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)

function NewsItem({ news, isFirst }: { news: SaleData, isFirst?: boolean }) {
  const router = useRouter()
  
  const { saleContractAddress, creator, name, symbol, logoUrl, websiteUrl, twitterUrl, telegramUrl, description, blockNumber, transactionHash, totalRaised, launched, positiveMarketcap, negativeMarketcap } = news

  return (
    <AnimatePresence>
      <motion.article 
        layout
        initial={isFirst ? { opacity: 0, y: -50 } : { opacity: 1, y: 0 }}
        animate={isFirst ? { opacity: 1, y: 0 } : {}}
        exit={isFirst ? { opacity: 0, y: 50 } : { opacity: 0 }}
        transition={isFirst ? {
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.5,
          duration: 0.3
        } : { duration: 0 }}
        className="w-full rounded-[23px] bg-[#F5F5F5] p-4 flex gap-4 max-w-[466px] relative overflow-hidden"
        onClick={() => {router.push(`/${saleContractAddress}`)}}
      >
        {isFirst && (
          <motion.div
            className="absolute inset-0 bg-[#1bffdd]"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        )}
        <Content 
          logoUrl={logoUrl} 
          name={name} 
          creator={creator}
          description={description}
          blockNumber={Number(blockNumber)}
          launched={launched}
          positiveMarketcap={Number(positiveMarketcap?.toFixed(2))}
          negativeMarketcap={Number(negativeMarketcap?.toFixed(2))}
        />
      </motion.article>
    </AnimatePresence>
  )
}

function SkeletonNewsItem() {
  return (
    <motion.div 
      className="w-full rounded-[23px] bg-[#F5F5F5] p-4 flex gap-4 max-w-[466px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex gap-4 w-full">
        <div className="relative w-[104px] flex-shrink-0 flex flex-col justify-center items-center">
          <div className="w-[90px] h-[90px] rounded-full bg-gray-300 animate-pulse" />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-1">
            <div className="h-5 w-1/2 bg-gray-300 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-300 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-20 bg-gray-300 rounded animate-pulse" />
          </div>
          <div className="h-10 w-full bg-gray-300 rounded animate-pulse mb-2" />
          <div className="flex gap-4">
            <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-300 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function SkeletonTopNews() {
  return (
    <motion.article 
      className="rounded-[19px] max-w-[910px] w-full bg-[#F5F5F5] h-[155px] flex items-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-[65%] flex items-center gap-6">
        <div className="h-24 w-24 rounded-full bg-gray-300 animate-pulse" />
        <div className="flex flex-col w-full">
          <div className="h-4 w-1/4 bg-gray-300 rounded animate-pulse mb-1" />
          <div className="h-6 w-3/4 bg-gray-300 rounded animate-pulse mb-2" />
          <div className="h-12 w-full bg-gray-300 rounded animate-pulse" />
        </div>
      </div>

      <div className="w-[1px] h-[80%] bg-neutral-200 mx-4" />

      <div className="w-[35%] flex items-center justify-between">
        <div className="w-28 h-28 rounded-full bg-gray-300 animate-pulse" />
        <div className="flex flex-col items-start w-1/2">
          <div className="h-4 w-full bg-gray-300 rounded animate-pulse mb-2" />
          <div className="h-4 w-full bg-gray-300 rounded animate-pulse mb-2" />
          <div className="h-4 w-full bg-gray-300 rounded animate-pulse" />
        </div>
      </div>
    </motion.article>
  )
}

function NewsContainer({_news}: {_news: SaleData[]}) {
  const [news, setNews] = useState<SaleData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log("Find news", news)
    if(_news.length > 0) {
      setNews(_news)
      setIsLoading(false)
    }
  },[_news])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 2xl:grid-cols-3 gap-6 w-full">
        {[...Array(6)].map((_, index) => (
          <SkeletonNewsItem key={index} />
        ))}
      </div>
    )
  }

  if (!news || news.length === 0) {
    return (
      <div className="w-full flex justify-center items-center h-64">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500 text-sm">No news available</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 2xl:grid-cols-3 gap-6 w-full">
      <AnimatePresence>
        {news.map((item, index) => (
          <NewsItem 
            key={`${item.saleContractAddress}-${index}`} 
            news={item} 
            isFirst={index === 0}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

const calculateMarketcap = async (sale: SaleData) => {
  const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");
  const [positiveMarketcap, negativeMarketcap] = sale.launched ? await Promise.all([
    calcMarketcap(sale.positiveToken, provider),
    calcMarketcap(sale.negativeToken, provider)
  ]) : [0, 0];
  return { ...sale, positiveMarketcap, negativeMarketcap };
}


export default function Component() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const _news = useNewsStore(state => state.news)
  const [topNews, setTopNews] = useState<SaleData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLaunched, setIsLaunched] = useState(false)
  const [news, setNews] = useState<SaleData[]>([])

  useEffect(() => {
    setNews(_news);
    (async () => {
      let biggestNews: SaleData|null = null;
      let biggestMarketcap = 0;
      const calculatedSaleData = await Promise.all(_news.map(async (sale) => {
        const calculatedSale = await calculateMarketcap(sale)
        const totalMarketcap = calculatedSale.positiveMarketcap + calculatedSale.negativeMarketcap;
        console.log(totalMarketcap, biggestMarketcap)
        if(totalMarketcap > biggestMarketcap) {
          biggestMarketcap = totalMarketcap
          biggestNews = calculatedSale
        }
        return calculatedSale
      }))
      setNews(calculatedSaleData)
      setTopNews(biggestNews)
      setIsLoading(false)
    })()
    
  },[_news])

  useEffect(() => {
    if(isLaunched) {
      setNews([...news].filter(item => item.launched))
    } else {
      setNews(_news)
    }
  },[isLaunched])


  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <div className="min-h-screen w-full bg-white flex justify-center pt-7 relative">
      <div className="w-full max-w-[1440px] px-4">
        {/* Header */}
        <header className="w-full">
          <div className="py-0">
            <h1 className={`text-center text-[50px] font-[0] text-black ${ibmPlexSerif.className}`}>
              Skin in the game
            </h1>
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between py-3 relative">
              
              <div className="flex items-center ml-auto">
                <Button
                  className="flex items-center gap-0 p-0 text-black hover:text-neutral-600"
                  variant="ghost"
                  onClick={openModal}
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
            </div>
            <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-neutral-200" />
            <div className="absolute left-0 right-0 bottom-[-3px] h-[1px] bg-neutral-200" />
          </div>
        </header>

        {/* Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <CreateNewsModal 
              closeModal={closeModal}
            />
          )}
        </AnimatePresence>

        <main className="mt-8 w-full flex flex-col items-center">
          {isLoading ? (
            <SkeletonTopNews />
          ) : topNews ? (
            <article onClick={() => router.push(`/${topNews.saleContractAddress}`)} className="rounded-[19px] max-w-[910px] w-full bg-[#F5F5F5] h-[155px] flex items-center p-6">
              <div className="w-[65%] flex items-center gap-6">
                <Avatar className="h-24 w-24 flex-shrink-0">
                  <AvatarImage src={topNews.logoUrl} alt={topNews.name} className="object-cover" />
                  <AvatarFallback>{topNews.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-black">{topNews.creator}</span>
                  </div>
                  <h2 className={`font-semibold mb-2 text-black ${ibmPlexSerif.className}`} style={{ fontSize: '18px' }}>
                    {topNews.name}
                  </h2>
                  <p className={`text-[#424242] ${ibmPlexSerif.className}`} style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    {topNews.description.slice(0, 120)}...
                  </p>
                </div>
              </div>

              <div className="w-[1px] h-[80%] bg-neutral-200 mx-4" />

              <div className="w-[35%] flex items-center justify-between">
                <div className="w-28 h-28 flex-shrink-0">
                  <PieChart
                    data={[
                      { title: 'Positive', value: topNews.positiveMarketcap || 0, color: '#EF4444' },
                      { title: 'Negative', value: topNews.negativeMarketcap || 0, color: '#3B82F6' },
                    ]}
                    lineWidth={15}
                    paddingAngle={2}
                    rounded
                    label={({ dataEntry }) => Math.round(dataEntry.percentage) + '%'}
                    labelStyle={{
                      fontSize: '10px',
                      fontFamily: 'sans-serif',
                      fill: '#444444',
                    }}
                    labelPosition={60}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <div className="mb-2">
                    <span className="text-xs text-red-500">Positive:</span>
                    <span className="ml-2 text-[14px] font-bold text-red-500">{Number(topNews.positiveMarketcap).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-xs text-blue-500">Negative:</span>
                    <span className="ml-2 text-[14px] font-bold text-blue-500">{Number(topNews.negativeMarketcap).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div>
                    <span className="text-xs text-green-500">market cap</span>
                    <span className="ml-2 text-[14px] font-bold text-green-500">{(topNews.positiveMarketcap + topNews.negativeMarketcap)?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </article>
          ) : null}

          <div className="flex gap-5 mt-6 mb-8 w-full max-w-[910px]">
            <button
              onClick={() => setIsLaunched(false)}
              className={!isLaunched ? `text-black ${ibmPlexSerif.className}` : `text-[#ABA8A8] ${ibmPlexSerif.className}`}
              style={{ 
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              Trending
            </button>
            <button
              onClick={() => setIsLaunched(!isLaunched)}
              className={isLaunched ? `text-black ${ibmPlexSerif.className}` : `text-[#ABA8A8] ${ibmPlexSerif.className}`}
              style={{ 
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              Launched
            </button>
          </div>

          <NewsContainer _news={news}/>
        </main>
      </div>
    </div>
  )
}

