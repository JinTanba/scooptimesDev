// @ts-nocheck
"use client"
import Image from "next/image"
import Link from "next/link"
import { Dispatch, useReducer } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Globe, Loader2, Plus, Search, Send, Trash2, Twitter, Upload, X } from "lucide-react"
import { IBM_Plex_Serif, IBM_Plex_Sans } from "next/font/google"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/router"
import { ethers } from "ethers"
import factoryArtifact from "../EtherFunFactory.json";
import { News } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Toaster } from "@/components/ui/toaster";
import WalletConnector from "@/lib/walletConnector";
// Font settings
const testPrivateKey = "68bf6ec02461aecaa2d401ff255a39dc1f97a23f4755837b0a06391513101846";
const provider = new ethers.providers.JsonRpcProvider("https://base-sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");
const testWallet = new ethers.Wallet(testPrivateKey, provider);
const factoryAddress = "0xa24e1a98642a63961FBBb662B7CfC41cbd313FC9";



type NewsAction = 
  | { type: 'INIT_NEWS'; payload: News[] }
  | { type: 'ADD_NEWS'; payload: News }
  | { type: 'UPDATE_NEWS'; payload: { saleContractAddress: string; totalRaised: string } }
  | { type: 'LAUNCH_NEWS'; payload: { saleContractAddress: string } };

function newsReducer(state: News[], action: NewsAction): News[] {
  switch (action.type) {
    case 'INIT_NEWS':
      return action.payload;

    case 'ADD_NEWS':
      return [action.payload, ...state];

    case 'UPDATE_NEWS': {
      const { saleContractAddress, totalRaised } = action.payload;
      const existingNewsIndex = state.findIndex(
        news => news.saleContractAddress.toLowerCase() === saleContractAddress.toLowerCase()
      );

      if (existingNewsIndex === -1) return state;

      const existingNews = state[existingNewsIndex];
      const updatedNews = {
        ...existingNews,
        totalRaised
      };

      // 古いニュースを削除して新しいニュースを先頭に追加
      const newState = [...state];
      newState.splice(existingNewsIndex, 1);
      return [updatedNews, ...newState];
    }

    case 'LAUNCH_NEWS': {
      const { saleContractAddress } = action.payload;
      return state.map(news => 
        news.saleContractAddress.toLowerCase() === saleContractAddress.toLowerCase()
          ? { ...news, launched: true }
          : news
      );
    }

    default:
      return state;
  }
}

async function createSale(
  name: string, 
  symbol: string, 
  logoUrl: string, 
  websiteUrl: string, 
  twitterUrl: string, 
  telegramUrl: string, 
  description: string, 
  relatedLinks: string[],
  wallet: ethers.Signer
) {
  console.log("👉createSale", name, symbol, logoUrl, websiteUrl, twitterUrl, telegramUrl, description, relatedLinks);
  try {

    const factory = new ethers.Contract(
      factoryAddress, 
      factoryArtifact.abi, 
      wallet
    );
    console.log(ethers.utils.parseEther('0.007').toString());

    const tx = await factory.createSale(
      name, 
      symbol, 
      logoUrl, 
      websiteUrl, 
      twitterUrl, 
      telegramUrl, 
      description, 
      relatedLinks,
      "",
      {
        value: ethers.utils.parseEther('0.007'),
        // gasLimit: 3000000, // ガスリミットを設定
      } // オーバーライドオプションを渡す
    );

    const receipt = await tx.wait();
    console.log("Sale created successfully", receipt?.transactionHash);

    return receipt.transactionHash;
  } catch (error) {
    console.error("Error creating sale:", error);
    throw error;
  }
}

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

// NewsItem Component
interface NewsItemProps {
  title: string
  content: string
  createdBy: string
  imageUrl: string
  positive: number
  negative: number
  marketCap: string
  timeAgo: string
}
function NewsItem({ news, isFirst }: { news: News, isFirst?: boolean }) {
  const router = useRouter()
  
  const { saleContractAddress, creator, name, symbol, saleGoal, logoUrl, websiteUrl, twitterUrl, telegramUrl, description, blockNumber, transactionHash, totalRaised, launched } = news;

  const Content = () => (
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
          {description}
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
        <Content />
      </motion.article>
    </AnimatePresence>
  )
}

// Token Details と Related Links を統合した新しいセクション
const TokenDetailsSection = ({ title, symbol, bio, setTitle, setSymbol, setBio, setRelatedLinks, relatedLinks }: { title: string, symbol: string, bio: string, setTitle: (title: string) => void, setSymbol: (symbol: string) => void, setBio: (bio: string) => void, setRelatedLinks: (relatedLinks: { id: number, url: string }[]) => void, relatedLinks: { id: number, url: string }[] }) => {


  const addRelatedLink = () => {
    setRelatedLinks([...relatedLinks, { id: Date.now(), url: '' }])
  }

  const removeRelatedLink = (id: number) => {
    setRelatedLinks(relatedLinks.filter(link => link.id !== id))
  }

  const updateRelatedLink = (id: number, url: string) => {
    setRelatedLinks(relatedLinks.map(link => link.id === id ? { ...link, url } : link))
  }

  return (
    <div className={`${ibmPlexSerif.className}`}>
      <h3 className="text-2xl font-semibold mb-4 border-b-2 border-black pb-2">Token Details</h3>
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} id="title" className="border-2 border-gray-300 rounded-none" />
      </div>
      <div className="mb-4">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} id="bio" className="border-2 border-gray-300 rounded-none" rows={4} />
      </div>
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Related Links</label>
        {relatedLinks.map((link, index) => (
          <div key={link.id} className="flex items-center mb-2">
            <Input
              value={link.url}
              onChange={(e) => updateRelatedLink(link.id, e.target.value)}
              className="border-2 border-gray-300 rounded-none mr-2"
              placeholder={`Related Link ${index + 1}`}
            />
            {relatedLinks.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeRelatedLink(link.id)}
                className="flex-shrink-0"
              >
                <Trash2 size={20} />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={addRelatedLink}
          className="mt-2"
        >
          <Plus size={20} className="mr-2" /> Add Related Link
        </Button>
      </div>
    </div>
  )
}

// SocialLinksのみを含む新しいコンポーネント
const SocialLinks = ({ twitter, telegram, website, setTwitter, setTelegram, setWebsite }: { twitter: string, telegram: string, website: string, setTwitter: (twitter: string) => void, setTelegram: (telegram: string) => void, setWebsite: (website: string) => void }) => {
  return (
    <div className={`space-y-6 ${ibmPlexSerif.className}`}>
      <h3 className="text-2xl font-semibold mb-4 border-b-2 border-black pb-2">Social Media</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
          <div className="flex items-center border-2 border-gray-300 rounded-none">
            <Twitter size={20} className="ml-2 text-gray-400" />
            <Input value={twitter} onChange={(e) => setTwitter(e.target.value)} id="twitter" className="border-0 focus:ring-0" placeholder="@username" />
          </div>
        </div>
        <div>
          <label htmlFor="telegram" className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
          <div className="flex items-center border-2 border-gray-300 rounded-none">
            <Send size={20} className="ml-2 text-gray-400" />
            <Input value={telegram} onChange={(e) => setTelegram(e.target.value)} id="telegram" className="border-0 focus:ring-0" placeholder="@username or t.me/link" />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
        <div className="flex items-center border-2 border-gray-300 rounded-none">
          <Globe size={20} className="ml-2 text-gray-400" />
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} id="website" className="border-0 focus:ring-0" placeholder="https://example.com" />
        </div>
      </div>
    </div>
  )
}


const Form = ({ wallet }: { wallet: ethers.Signer | null }) => {
  const [title, setTitle] = useState("")
  const [symbol, setSymbol] = useState("")
  const [bio, setBio] = useState("")
  const [relatedLinks, setRelatedLinks] = useState([{ id: 1, url: '' }])
  const [twitter, setTwitter] = useState("")
  const [telegram, setTelegram] = useState("")
  const [website, setWebsite] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null);
  //connect Metamask
  const { toast } = useToast()

  const handlePublish = async () => {
    try {
      if (!uploadedImage) {
        console.error("No image uploaded")
        return
      }
      
      setIsLoading(true)
      const links = relatedLinks.map(link => link.url).filter(url => url.trim() !== '')
      if(!wallet) return;
      const result = await createSale(
        title,
        symbol,
        uploadedImage,
        website,
        twitter,
        telegram,
        bio,
        links,
        wallet
      )
      
      setTxHash(result.hash)
      toast({
        title: "🔥Transaction Successful",
        description: `Your token has been created. Transaction hash: ${result.hash}`,
      })
    } catch (error) {
      console.error("Error publishing token:", error)
      toast({
        title: "Error",
        description: "Failed to create token. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File", file);

    setUploadedImage(URL.createObjectURL(file))

    try {
      // FormDataの作成
      const formData = new FormData();
      formData.append('image', file);
      console.log("Start Uploading...");
      // アップロード中の表示
      setIsLoading(true);


      // APIエンドポイントへのリクエスト
      const response = await fetch('/api/uploadIPFS', {
        method: 'POST',
        body: formData,
      });

      console.log("Uploading finished");

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      console.log("data", data);
      setUploadedImage(data)
      
      toast({
        title: "Upload Successful",
        description: "Image has been uploaded to IPFS",
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div>
      {/* <WalletConnector onWalletChange={setWallet} /> */}
        <TokenDetailsSection 
          title={title} 
          symbol={symbol} 
          bio={bio} 
          setTitle={setTitle} 
          setSymbol={setSymbol} 
          setBio={setBio} 
          setRelatedLinks={setRelatedLinks} 
          relatedLinks={relatedLinks ? relatedLinks : []} 
        />
        <SocialLinks 
          twitter={twitter} 
          telegram={telegram} 
          website={website} 
          setTwitter={setTwitter} 
          setTelegram={setTelegram} 
          setWebsite={setWebsite} 
        />
      </div>
      <div className="space-y-6">
        <div className={`${ibmPlexSerif.className}`}>
          <h3 className="text-2xl font-semibold mb-4 border-b-2 border-black pb-2">Token Icon</h3>
          <div className="mb-4">
            <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">Upload Icon</label>
            <div className="mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-none">
              {uploadedImage ? (
                <div className="w-[260px] h-[260px] rounded-full overflow-hidden mb-4">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded icon"
                    width={260}
                    height={260}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-[260px] h-[260px] rounded-full bg-gray-200 flex items-center justify-center mb-4">
                  <Upload size={64} className="text-gray-400" />
                </div>
              )}
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>{uploadedImage ? 'Change image' : 'Upload a file'}</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    onChange={handleImageUpload}
                  />
                </label>
                {!uploadedImage && <p className="pl-1">or drag and drop</p>}
              </div>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center">
        <Button 
          onClick={handlePublish} 
          className={`px-8 py-3 bg-black text-white hover:bg-gray-800 ${ibmPlexSans.className}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish Token'
          )}
        </Button>
      </div>
      {txHash && (
        <Alert className="mt-4">
          <AlertTitle>Transaction Successful</AlertTitle>
          <AlertDescription>
            Your token has been created. Transaction hash: {txHash}
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}

const ModalContent = ({ closeModal, wallet }: { closeModal: () => void, wallet: ethers.Signer | null }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 text-black"
      onClick={closeModal}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="bg-[#F5F5F5] rounded-[23px] p-8 w-[1007px] max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        <div className={`text-center mb-8 ${ibmPlexSerif.className}`}>
          <h2 className="text-4xl font-bold mb-2">Scoop Times</h2>
          <p className="text-xl">Token Creation Edition</p>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <Form wallet={wallet} />
        </div>
        <Toaster />
      </motion.div>
    </motion.div>
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

export default function Component({ wallet }: { wallet: ethers.Signer | null }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [news, dispatch] = useReducer(newsReducer, [])

  useEffect(()=>{
    console.log("-------- useEffect ------", news);
    fetch('/api/getNews')
      .then(res => res.json())
      .then(data => {
        if (!data.data) return;
        console.log("data", data.data.sales);
        dispatch({ type: 'INIT_NEWS', payload: data.data.sales })
      })
  },[])
  

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      setUploadedImage(imageUrl)
    }
  }

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
                  <span className="pr-4">create new token]</span>
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
            <ModalContent 
              closeModal={closeModal}
              wallet={wallet}
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
                We've spent two years examining the implications of a second Donald Trump presidency. He wants to radically reshape the federal government and consolidate executive power. He tried to do much of this in his first term but was largely stymied. Now, he's intent on hiring people less likely to say no.
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
                        We've spent two years examining the implications of a second Donald Trump presidency. He wants to radically reshape the federal government and consolidate executive power.
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

          <NewsContainer dispatch={dispatch} news={news} />
        </main>
      </div>
    </div>
  )
}


function NewsContainer({ dispatch, news }: { dispatch: Dispatch<NewsAction>, news: News[] }) {
  useEffect(() => {
    const provider = new ethers.providers.JsonRpcProvider("https://base-sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");
    const factory = new ethers.Contract(
      factoryAddress,
      [
        "event SaleCreated(address indexed saleContractAddress, address indexed creator, string name, string symbol, uint256 saleGoal, string logoUrl, string websiteUrl, string twitterUrl, string telegramUrl, string description, string[] relatedLinks, string message)",
        "event TokensBought(address indexed saleContractAddress, address indexed buyer, uint256 totalRaised, uint256 tokenBalance)",
        "event SaleLaunched(address indexed saleContractAddress, address indexed launcher)",
        "event TokensSold(address indexed saleContractAddress, address indexed seller, uint256 tokenAmount, uint256 ethAmount, uint256 timestamp)",

      ],
      provider
    );

    // SaleCreatedイベントの監視
    const handleSaleCreated = async (
      saleContractAddress: string,
      creator: string,
      name: string,
      symbol: string,
      saleGoal: ethers.BigNumber,
      logoUrl: string,
      websiteUrl: string,
      twitterUrl: string,
      telegramUrl: string,
      description: string,
      event: ethers.Event
    ) => {
      const newSale: News = {
        saleContractAddress,
        creator,
        name,
        symbol,
        saleGoal: ethers.utils.formatEther(saleGoal),
        logoUrl,
        websiteUrl,
        twitterUrl,
        telegramUrl,
        description,
        blockNumber: event.blockNumber.toString(),
        transactionHash: event.transactionHash,
        totalRaised: "0",
        launched: false
      };

      dispatch({ type: 'ADD_NEWS', payload: newSale });
    };

    // TokensBoughtイベントの監視
    const handleTokensBought = (
      saleContractAddress: string,
      buyer: string,
      totalRaised: ethers.BigNumber,
      tokenBalance: ethers.BigNumber,
      event: ethers.Event
    ) => {
      dispatch({
        type: 'UPDATE_NEWS',
        payload: {
          saleContractAddress,
          totalRaised: ethers.utils.formatEther(totalRaised),
        }
      });
    };

    // SaleLaunchedイベントの監視
    const handleSaleLaunched = (
      saleContractAddress: string,
      launcher: string,
      event: ethers.Event
    ) => {
      dispatch({
        type: 'LAUNCH_NEWS',
        payload: { saleContractAddress }
      });
    };

    // イベントリスナーの設定
    factory.on("SaleCreated", handleSaleCreated);
    factory.on("TokensBought", handleTokensBought);
    factory.on("SaleLaunched", handleSaleLaunched);

    // クリーンアップ
    return () => {
      factory.removeListener("SaleCreated", handleSaleCreated);
      factory.removeListener("TokensBought", handleTokensBought);
      factory.removeListener("SaleLaunched", handleSaleLaunched);
    };
  }, [dispatch]);

  // ニュースの表示
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
  );
}