import Image from "next/image"
import { Globe, Loader2, Plus, Send, Trash2, Twitter, Upload, X } from "lucide-react"
import { IBM_Plex_Serif, IBM_Plex_Sans } from "next/font/google"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { ethers } from "ethers"
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Toaster } from "@/components/ui/toaster";
import factoryArtifact from "../EtherFunFactory.json";
import { useSignerStore } from "@/lib/walletConnector"

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
const testPrivateKey = "68bf6ec02461aecaa2d401ff255a39dc1f97a23f4755837b0a06391513101846";
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");  
const testWallet = new ethers.Wallet(testPrivateKey, provider);
const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c";
  
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
        <h3 className="text-2xl font-semibold mb-4 border-b-2 border-black pb-2">Topic Detail</h3>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title(TokenName)</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} id="title" className="border-2 border-gray-300 rounded-none" />
        </div>
  
        <div className="mb-4">
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">Symbol(ticker symbol)</label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} id="symbol" className="border-2 border-gray-300 rounded-none" />
        </div>
        
        <div className="mb-4">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
  
  
  const Form = () => {
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
    const wallet = useSignerStore(state => state.signer);

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
        setIsLoading(false)
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
      setIsLoading(true)
      console.log("👉handleImageUpload");
      const file = event.target.files?.[0];
      const formData = new FormData();
      if(!file) return;
      formData.append('file', file);
      const response = await fetch('/api/uploadIPFS', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アップロードに失敗しました');
      }
      setIsLoading(false)
      setUploadedImage(data.url);
    }
  
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
          {/* <SocialLinks 
            twitter={twitter} 
            telegram={telegram} 
            website={website} 
            setTwitter={setTwitter} 
            setTelegram={setTelegram} 
            setWebsite={setWebsite} 
          /> */}
        </div>
        <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-semibold mb-4 border-b-2 border-black pb-2">
            Topic Icon
          </h3>
          <div className="mb-4">
            <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
              Upload Icon
            </label>
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
                  <span>{isLoading ? 'Uploading...' : uploadedImage ? 'Change image' : 'Upload a file'}</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleImageUpload}
                    accept="image/*"
                    disabled={isLoading}
                  />
                </label>
                {!uploadedImage && !isLoading && <p className="pl-1">or drag and drop</p>}
              </div>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>
      </div>
        <div className="mt-8 text-center">
          <Button 
            onClick={() => handlePublish()} 
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
  
  export const CreateNewsModal = ({ closeModal }: { closeModal: () => void}) => {
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
            <Form/>
          </div>
          <Toaster />
        </motion.div>
      </motion.div>
    )
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
    wallet: ethers.Signer | null
  ) {
    console.log("👉createSale", name, symbol, logoUrl, websiteUrl, twitterUrl, telegramUrl, description, relatedLinks);
    try {
      if(!wallet) {
        console.error("No wallet connected");
        return;
      }
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
  
  