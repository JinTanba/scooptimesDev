'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Send, MessageCircle, Share2, Heart } from 'lucide-react'
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

interface CommentNode extends Comment {
  replies: CommentNode[];
}

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const commentMap = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  // First, convert all comments to CommentNodes with empty replies array
  comments.forEach(comment => {
    commentMap.set(Number(comment.id)!, {
      ...comment,
      replies: []
    });
  });

  // Then, build the tree structure
  comments.forEach(comment => {
    const node = commentMap.get(Number(comment.id)!);
    if (node) {
      if (!comment.parentId) {
        // This is a root comment
        roots.push(node);
      } else {
        // This is a reply
        const parentNode = commentMap.get(Number(comment.parentId));
        if (parentNode) {
          parentNode.replies.push(node);
        }
      }
    }
  });

  console.log(roots)

  return roots;
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
    <div className="relative w-full mb-4">
      <div className="ml-20 relative w-[80%]">
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
function CommentThread({ comment, newsAddress, onCommentSent, depth = 0 }: { 
  comment: CommentNode; 
  newsAddress: string; 
  onCommentSent: () => void;
  depth?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const type = "PoS"
  const isTop = true
  const formattedAddress = `${comment.userAddress.slice(0, 6)}....${comment.userAddress.slice(-4)}`
  const badgeColor = type === 'PoS' ? 'bg-red-500' : 'bg-blue-500'
  const balanceBadgeColor = type === 'PoS' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'
  const balance = 1000

  const handleLike = () => {
    setLikeCount(prevCount => prevCount + 1);
    // Here you would typically also send a request to update the like count in your backend
  };

  const handleShare = () => {
    // Implement share functionality here
    console.log('Share comment:', comment.id);
  };

  return (
    <div className="group mb-6 mt-8"> {/* Added margin-bottom for spacing between comments */}
      <div className="flex gap-4">
        {/* Avatar and content column */}
        <div className="flex-shrink-0 relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://pbs.twimg.com/media/EmNlJLpU4AEtZo7?format=png&name=900x900" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          
          {/* Vertical line for replies */}
          {comment.replies.length > 0 && (
            <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200 group-hover:bg-gray-300" />
          )}
        </div>
        
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
          <p className={`mt-1 text-[13px] font-normal text-[#424242] ${ibmPlexSans.className}`}>
            {comment.content}
          </p>
          <div className="mt-2 flex items-center gap-1">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="text-gray-500 hover:text-gray-700"
            >
              <Heart className="h-4 w-4 mr-1" />
              {likeCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-500 hover:text-gray-700"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
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

      {/* Render nested replies */}
      {comment.replies.length > 0 && (
        <div className="pl-[52px] mt-2 relative">
          {/* Horizontal curve */}
          <div className="absolute left-5 top-0 w-[47px] h-6">
            <div className="absolute left-0 top-0 w-full h-full border-l-2 border-b-2 border-gray-200 rounded-bl-xl group-hover:border-gray-300" />
          </div>
          
          <div className="space-y-4">
            {comment.replies.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                newsAddress={newsAddress}
                onCommentSent={onCommentSent}
                depth={depth + 1}
              />
            ))}
          </div>
        </div>
      )}
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
  const [commentTree, setCommentTree] = useState<CommentNode[]>([]);

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
    
    // Build the comment tree
    const tree = buildCommentTree(data || []);
    console.log('TREEEEEsssssss', tree)
    setCommentTree(tree);
  }

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
        <div className="max-w-[80%] mx-auto flex items-center justify-between py-2 border-b-2 border-black-500">
          <Link href="/" className="text-black font-['Times_New_Roman'] text-lg">
            [back]
          </Link>
          <h1 className={`text-center text-[25px] font-[600] text-black ${ibmPlexSerif.className}`}>
            Skin In The Game
          </h1>
          <div className="w-[70px]"></div> {/* Spacer to balance the layout */}
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

          <div className="mt-8">
            <WriteComment parentId={""} newsAddress={address as string} onCommentSent={handleCommentSent} />
          </div>

          <div className="space-y-8 mt-6">
            {loading ? (
              Array(3).fill(null).map((_, index) => (
                <div key={index} className="animate-pulse flex gap-4 w-full mt-10">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
            <div className="w-[80%] mx-auto">
              {commentTree.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  newsAddress={address as string}
                  onCommentSent={handleCommentSent}
                />
              ))}
            </div>
            )}
          </div>
        </section>
        <TokenTrade />
      </main>
    </div>
  )
}

