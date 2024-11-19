import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Search } from "lucide-react"
import { IBM_Plex_Serif, IBM_Plex_Sans } from "next/font/google"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/router"
import { ethers } from "ethers"
import { News } from "@/types";
import { CreateNewsModal } from "@/components/CreateNews";
import { useEffect, useState } from "react"
import { useNewsStore } from "@/lib/NewsState"
import { useSignerStore } from "@/lib/walletConnector"

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

const Content = ({logoUrl, name, blockNumber, creator, description}: {logoUrl: string, name: string, blockNumber: number, creator: string, description: string}) => (
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
        <div className="flex items-center gap-1">
          <span className="text-red-500">positive</span>
          <span className="text-red-500">{"30"}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-blue-500">Negative</span>
          <span className="text-blue-500">{"70"}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-green-500">market cap</span>
          <span className="text-green-500">{"5b"}</span>
        </div>
      </div>
    </div>
  </div>
);

function NewsItem({ news, isFirst }: { news: News, isFirst?: boolean }) {
  const router = useRouter()
  
  const { saleContractAddress, creator, name, symbol, saleGoal, logoUrl, websiteUrl, twitterUrl, telegramUrl, description, blockNumber, transactionHash, totalRaised, launched } = news;

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
        />
      </motion.article>
    </AnimatePresence>
  )
}


interface Purchase {
  id: string
  saleContractAddress: string
  buyer: string
  totalRaised: string
  tokenBalance: string
  blockNumber: number
  transactionHash: string
  timestamp: string
}

interface SaleMetadata {
  creator: string
  saleGoal: string
  logoUrl: string
  websiteUrl: string
  twitterUrl: string
  telegramUrl: string
  description: string
}


function NewsContainer() {
  //zastandでニュース配列をチェックしよう！！
  // ニュースの表示
  const news = useNewsStore(state => state.news);

  useEffect(() => {
    console.log("Find news", news)
  },[news])

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
          <p className="text-gray-500 text-sm">Loading news...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 2xl:grid-cols-3 gap-6 w-full">
      <AnimatePresence>
        {news?.map((item, index) => (
          <NewsItem 
            key={`${item.saleContractAddress}-${index}`} 
            news={item} 
            isFirst={index === 0}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}


export default function Component() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const wallet = useSignerStore(state => state.signer);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  return (
    <div className="min-h-screen w-full bg-white flex justify-center pt-7 relative">
      {/* <WalletConnector onWalletChange={setWallet} /> */}
      <div className="w-full max-w-[1440px] px-4">
        {/* Header */}
        <header className="w-full">
          <div className="py-0">
            <h1 className={`text-center text-[50px] font-[600] text-black ${ibmPlexSerif.className}`}>
              Scoop Times
            </h1>
          </div>
          
          <div className="relative">
            <div className="flex items-center justify-between py-3 relative">
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <nav className="flex items-center space-x-8 text-black">
                  <Link className={`text-sm hover:text-neutral-600 ${ibmPlexSerif.className}`} href="#">all</Link>
                  <Link className={`text-sm hover:text-neutral-600 ${ibmPlexSerif.className}`} href="#">Crypto</Link>
                  <Link className={`text-sm hover:text-neutral-600 ${ibmPlexSerif.className}`} href="#">politics</Link>
                  <Link className={`text-sm hover:text-neutral-600 ${ibmPlexSerif.className}`} href="#">sports</Link>
                  <Link className={`text-sm hover:text-neutral-600 ${ibmPlexSerif.className}`} href="#">tech</Link>
                </nav>
              </div>
              <div className="flex items-center ml-auto">
                <div className="relative mr-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    className={`h-8 w-64 rounded-full bg-neutral-100 pl-9 pr-4 text-sm outline-none ${ibmPlexSans.className}`}
                    placeholder="search"
                    type="search"
                  />
                </div>
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
          <article className="rounded-[19px] max-w-[910px] w-full bg-[#F5F5F5] h-[155px] flex items-center p-6">
            <div className="flex flex-col items-start">
              <Image 
                src="/fire.gif" 
                alt="Fire animation"
                width={80}
                height={80}
                className="w-20 h-20"
              />
              <span className={`text-center text-sm mt-1 text-black ${ibmPlexSerif.className}`}>
                King of th hill
              </span>
            </div>

            <div className="w-[35%] pl-10 pr-5">
              <div className="flex items-start gap-2 mb-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span className="text-xs text-black">0xij332u2|ej</span>
              </div>
              <p className={`text-[#424242] ${ibmPlexSerif.className}`} style={{ fontSize: '8px' }}>
                {/* We've spent two years examining the implications of a second Donald Trump presidency. He wants to radically reshape the federal government and consolidate executive power. He tried to do much of this in his first term but was largely stymied. Now, he's intent on hiring people less likely to say no. */}
              </p>
            </div>

            <div className="w-[1px] h-[80%] bg-neutral-200" />

            <div className="w-[50%] pl-6">
              <div className="flex gap-4">
                <div className="w-[106px] h-[93px] relative flex-shrink-0">
                  <Avatar className="w-[106px] h-[106px]">
                    <AvatarImage
                      src="/news3.webp"
                      alt="News image"
                      className="object-cover"
                    />
                    <AvatarFallback>NT</AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <div className="flex-2">
                      <h2 className={`font-semibold mb-2 text-black ${ibmPlexSerif.className}`} style={{ fontSize: '12px' }}>
                        title of this news
                      </h2>
                      <p className={`text-[#424242] ${ibmPlexSerif.className}`} style={{ fontSize: '8px' }}>
                        {/* We've spent two years examining the implications of a second Donald Trump presidency. He wants to radically reshape the federal government and consolidate executive power. */}
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-red-500 text-[8px]">positive</span>
                        <span className="text-lg font-bold text-red-500">50%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-blue-500 text-[8px]">Negative</span>
                        <span className="text-lg font-bold text-blue-500">50%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div className="flex gap-5 mt-6 mb-8 w-full max-w-[910px]">
            <button
              className={`text-black ${ibmPlexSerif.className}`}
              style={{ 
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              Trending
            </button>
            <button
              className={`text-[#ABA8A8] ${ibmPlexSerif.className}`}
              style={{ 
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              scoop
            </button>
            <button
              className={`text-[#ABA8A8] ${ibmPlexSerif.className}`}
              style={{ 
                fontSize: '16px',
                fontWeight: 500
              }}
            >
              Top10
            </button>
          </div>

          <NewsContainer/>
        </main>
      </div>
    </div>
  )
}



