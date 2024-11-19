'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Send, MessageCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { IBM_Plex_Serif, IBM_Plex_Sans } from "next/font/google"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import TokenTrade from "@/components/TokenTrade"
import { useSignerStore } from "@/lib/walletConnector"
import { useRouter } from "next/router"
import { ethers } from "ethers"
import { Comment } from "@/types"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://lipbpiidmsjeuqemorzv.supabase.co"
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcGJwaWlkbXNqZXVxZW1vcnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5MjE2MDksImV4cCI6MjA0NzQ5NzYwOX0.9u0nQ_2W99oFAfUMBp8KMyrQLfFkko55mgaV7AygzFU"
const supabase = createClient(supabaseUrl, anonKey);

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

async function sendComment({content, wallet, parentId, newsAddress}: {content: string, wallet: ethers.Signer, parentId: string, newsAddress: string}) {
  console.log("👉writeComment");
  const userAddress = await wallet.getAddress();
  const comment: Comment = {
    content: content,
    userAddress: userAddress,
    parentId: parentId,
    newsAddress: newsAddress,
    likeCount: 0,
  }
  await fetch("/api/createComment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({comment}),
  });
}

function WriteComment({ parentId, newsAddress, onCommentSent }: { parentId: string, newsAddress: string, onCommentSent: () => void }) {
  const [content, setContent] = useState("");
  const wallet = useSignerStore(state => state.signer);

  const handleSendComment = async () => {
    if (wallet && content.trim()) {
      await sendComment({content, wallet, parentId, newsAddress});
      setContent("");
      onCommentSent();
    }
  };

  return (
    <div className="relative w-full flex justify-center mb-4">
      <div className="relative w-full">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className={`w-full h-[47px] pl-4 pr-12 rounded-[22px] border border-[#BFBFBF] bg-white ${ibmPlexSans.className}`}
        />
        {wallet && (
          <Button
            className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full p-2"
            variant="ghost"
            onClick={handleSendComment}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send comment</span>
          </Button>
        )}
      </div>
    </div>
  )
}

function CommentThread({ comment, newsAddress, onCommentSent }: { comment: Comment, newsAddress: string, onCommentSent: () => void }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const type = "PoS"
  const isTop = true
  const formattedAddress = `${comment.userAddress.slice(0, 6)}....${comment.userAddress.slice(-4)}`
  const badgeColor = type === 'PoS' ? 'bg-red-500' : 'bg-blue-500'
  const balanceBadgeColor = type === 'PoS' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'
  const balance = 1000

  return (
    <div className="flex gap-4 ml-[80px] w-[90%] mx-auto mt-6 justify-center">
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
          {comment.content}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <Badge 
            variant="secondary" 
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              balanceBadgeColor
            )}
          >
            balance: {balance.toLocaleString()}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-gray-500 hover:text-gray-700"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Reply
          </Button>
        </div>
        {showReplyForm && (
          <div className="mt-4">
            <WriteComment
              parentId={comment.id || ""}
              newsAddress={newsAddress}
              onCommentSent={() => {
                setShowReplyForm(false);
                onCommentSent();
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

interface SaleMetadata {
  creator: string
  saleGoal: string
  logoUrl: string
  websiteUrl: string
  twitterUrl: string
  telegramUrl: string
  description: string
  name: string
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  )
}

export default function Page() {
  const router = useRouter();
  const { address } = router.query;
  const [metadata, setMetadata] = useState<SaleMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (address) {
      setLoading(true);
      fetch(`/api/getNewsDisplayData?address=${address}`)
        .then(res => res.json())
        .then(data => {
          setMetadata(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("🔥error", error);
          setLoading(false);
        });
    }
  }, [address]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comment')
      .select()
      .eq('newsAddress', address as string)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return
    }

    setComments(data || [])
  }

  useEffect(() => {
    if (address) {
      fetchComments()
    }
  }, [address])

  const handleCommentSent = () => {
    fetchComments()
  }
  
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
              {loading ? (
                <div className="w-[115px] h-[115px] rounded-full bg-gray-200 animate-pulse"></div>
              ) : (
                <Image
                  src={metadata?.logoUrl.replace("blob:", "") || ""}
                  alt="Article image"
                  width={115}
                  height={115}
                  className="rounded-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              {loading ? (
                <SkeletonLoader />
              ) : (
                <>
                  <h2 className={`text-[41px] font-normal leading-tight mb-4 ${ibmPlexSerif.className}`}>
                    {metadata?.name || ""}
                  </h2>
                  <p className={`text-[13px] font-light ${ibmPlexSans.className}`}>
                    {metadata?.description || ""}
                  </p>
                </>
              )}
            </div>
          </article>

          <WriteComment parentId={""} newsAddress={address as string} onCommentSent={handleCommentSent} />

          <div className="space-y-8 mt-6">
            {loading ? (
              Array(3).fill(null).map((_, index) => (
                <div key={index} className="animate-pulse flex gap-4 ml-[80px] w-[90%] mx-auto mt-10 justify-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    newsAddress={address as string}
                    onCommentSent={handleCommentSent}
                  />
                ))}
              </>
            )}
          </div>
        </section>
        <TokenTrade />
      </main>
    </div>
  )
}