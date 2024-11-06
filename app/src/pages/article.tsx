import Link from "next/link"
import Image from "next/image"
import { Search, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { IBM_Plex_Serif, IBM_Plex_Sans } from "next/font/google"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import TokenTrade from "@/components/TokenTrade"
import { ethers } from "ethers"

const ibmPlexSerif = IBM_Plex_Serif({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
})

function WriteComment() {
  return (
    <div className="relative w-full flex justify-center mb-10">
      <div className="relative w-[80%]">
        <Input
          placeholder="Write a comment..."
          className={`w-full h-[47px] pl-4 pr-12 rounded-[22px] border border-[#BFBFBF] bg-white ${ibmPlexSans.className}`}
        />
        <Button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-2"
          variant="ghost"
        >
          <Send className="h-5 w-5" />
          <span className="sr-only">Send comment</span>
        </Button>
      </div>
    </div>
  )
}

interface CommentThreadProps {
  address: string
  content: string
  balance: number
  type?: 'PoS' | 'NeG'
  isTop?: boolean
}

function CommentThread({ 
  address, 
  content, 
  balance, 
  type = 'NeG',
  isTop
}: CommentThreadProps) {
  const formattedAddress = `${address.slice(0, 6)}....${address.slice(-4)}`
  const badgeColor = type === 'PoS' ? 'bg-red-500' : 'bg-blue-500'
  const balanceBadgeColor = type === 'PoS' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'

  return (
    <div className="flex gap-4 ml-[80px] w-[90%] mx-auton mt-10 justify-center ">
      <Avatar className="h-10 w-10">
        <AvatarImage src="https://pbs.twimg.com/media/EmNlJLpU4AEtZo7?format=png&name=900x900" />
        <AvatarFallback>UN</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${ibmPlexSans.className}`}>{formattedAddress}</span>
          {isTop && (
            <Badge 
              variant="secondary" 
              className={cn("rounded-full px-2 py-0.5 text-white text-xs", badgeColor)}
            >
              {type}
            </Badge>
          )}
        </div>
        <p className={`mt-1 w-[90%] text-[13px] font-normal text-[#424242] ${ibmPlexSans.className}`} style={{ fontFamily: '"IBM Plex Sans JP", sans-serif' }}>
          {content}
        </p>
        <div className="mt-2">
          <Badge 
            variant="secondary" 
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              balanceBadgeColor
            )}
          >
            balance: {balance.toLocaleString()}
          </Badge>
        </div>
      </div>
    </div>
  )
}

export default function Page({ wallet }: { wallet: ethers.Signer | null }) {
  return (
    <div className="min-h-screen bg-white">
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

      <main className="max-w-[80%] mx-auto mt-8 flex justify-between">
        <section className="flex-1 mr-8">
          <article className="flex gap-6 mb-8">
            <div className="flex-shrink-0">
              <Image
                src="https://pbs.twimg.com/media/EmNlJLpU4AEtZo7?format=png&name=900x900"
                alt="Lady Gaga"
                width={115}
                height={115}
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className={`text-[41px] font-normal leading-tight mb-4 ${ibmPlexSerif.className}`}>
                Lady Gaga's Dance-Floor Antidote, and 9 More New Songs
              </h2>
              <p className={`text-[13px] font-light ${ibmPlexSans.className}`}>
                In a new report from Animoca Brands Research, analysts claim that Polymarket will likely have staying power after today's presidential election in the United States — an event that has skyrocketed the decentralized betting platform's popularity into the mainstream.
                Polymarket, an onchain prediction market that provides quantitative odds for future events, saw its monthly trading volume surge from $40 million to $2.5 billion between April and October, according to the report. Meanwhile, open interest increased from $20 million to $400 million. In October alone, the platform's website drew 35 mIn a new report from Animoca Brands Research, analysts claim that Polymarket will likely have staying power after today's presidential election in the United States — an event that has skyrocketed the decentralized betting platform's popularity into the mai
              </p>
            </div>
          </article>

          <WriteComment />

          <div className="space-y-8 mt-6 ">
            <CommentThread
              address="0x8218....1821"
              content="We've spent two years examining the implications of a second Donald Trump presidency. He wants to radically reshape the federal government and consolidate executive power. He tried to do much of this in his first term but was largely stymied. Now, he's intent on hiring people less likely to say no."
              balance={100000}
              type="NeG"
              isTop={true}
            />
            <CommentThread
              address="0x8218....1821"
              content="We've spent two years examining the implications of a second Donald Trump presidency. He wants to radically reshape the federal government and consolidate executive power. He tried to do much of this in his first term but was largely stymied. Now, he's intent on hiring people less likely to say no."
              balance={100000}
              type="NeG"
              isTop={true}
            />            
            <CommentThread
              address="0x8218....1821"
              content="We've spent two years examining the implications of a second Donald Trump presidency. He wants to radically reshape the federal government and consolidate executive power. He tried to do much of this in his first term but was largely stymied. Now, he's intent on hiring people less likely to say no."
              balance={100000}
              type="NeG"
              isTop={true}
            />
            {/* More comments can be added here */}
          </div>
        </section>
          <TokenTrade wallet={wallet} />
      </main>
    </div>
  )
}