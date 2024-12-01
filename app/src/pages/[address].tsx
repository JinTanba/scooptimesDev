import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Send, MessageCircle, Share2, Heart, Coins, ChevronUp, ChevronDown, Award } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { IBM_Plex_Serif, IBM_Plex_Sans } from "next/font/google"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import TokenTrade from "@/components/TokenTrade"
import { useSignerStore } from "@/lib/walletConnector"
import { useRouter } from "next/router"
import { ethers } from "ethers"
import { Comment, SaleData } from "@/types"
import { Textarea } from "@/components/ui/textarea"
import { GradationIcon } from "@/components/GradationIcon"
import { useNewsStore } from "@/lib/NewsState"

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const wallet = useSignerStore(state => state.signer);

  const handleSendComment = async () => {
    if (wallet && content.trim()) {
      setIsSubmitting(true);
      try {
        await sendComment({content, wallet, parentId, newsAddress});
        setContent("");
        setIsExpanded(false);
        onCommentSent();
      } catch (error) {
        console.error("Error sending comment:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setContent("");
  };

  return (
    <div className="relative w-full mb-4">
      <div className="ml-20 relative w-[80%]">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="Write a comment..."
          className={`w-full px-4 rounded-[22px] border border-[#BFBFBF] bg-white transition-all duration-300 ease-in-out resize-none ${
            isExpanded ? 'h-32 pb-14' : 'h-[47px] py-3'
          } ${ibmPlexSans.className}`}
          disabled={isSubmitting}
        />
        {isExpanded && wallet && (
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 px-4 h-8 rounded-full"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendComment}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 h-8 rounded-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Comment'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function CommentThread({ comment, newsAddress, onCommentSent, depth = 0 }: { comment: CommentNode, newsAddress: string, onCommentSent: () => void, depth: number }) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0)
  const formattedAddress = `${comment.userAddress.slice(0, 6)}....${comment.userAddress.slice(-4)}`
  
  const getDisplayProperties = () => {
    const positiveAmount = Number(comment.balance.positiveBalance || 0)
    const negativeAmount = Number(comment.balance.negativeBalance || 0)
    const saleAmount = Number(comment.balance.saleBalance || 0)

    if (positiveAmount > 0 || negativeAmount > 0) {
      if (positiveAmount > negativeAmount) {
        return { 
          color: 'bg-red-500', 
          type: 'Positive', 
          show: true,
          balance: positiveAmount,
          balanceColor: 'bg-red-100 text-red-500'
        }
      } else {
        return { 
          color: 'bg-blue-500', 
          type: 'Negative', 
          show: true,
          balance: negativeAmount,
          balanceColor: 'bg-blue-100 text-blue-500'
        }
      }
    } else if (saleAmount > 0) {
      return { 
        color: 'bg-black', 
        type: 'Holder', 
        show: true,
        balance: saleAmount,
        balanceColor: 'bg-gray-100 text-gray-500'
      }
    }
    return { 
      color: '', 
      type: '', 
      show: false,
      balance: 0,
      balanceColor: ''
    }
  }

  const { color, type, show, balance, balanceColor } = getDisplayProperties()

  const handleLike = () => {
    setLikeCount(prevCount => prevCount + 1)
  }

  const handleShare = () => {
    console.log('Share comment:', comment.id)
  }

  return (
    <div className={cn(
      "relative",
      depth > 0 && "pl-[60px] mt-6"
    )}>
      {depth > 0 && (
        <div 
          className="absolute left-[30px] top-0 bottom-0 w-[2px] bg-gray-200"
          style={{
            content: '""',
            top: '-24px',
          }}
        />
      )}
      
      <div className="relative flex gap-4 pt-4">
        <div className="h-10 w-10 flex-shrink-0">
          <GradationIcon address={comment.userAddress} size={40} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={cn(
              "text-sm font-medium text-gray-900",
              ibmPlexSans.className
            )}>
              {formattedAddress}
            </span>
            {show && (
              <Badge 
                variant="secondary" 
                className={cn("rounded-full px-2 py-0.5 text-white text-xs", color)}
              >
                {type}
              </Badge>
            )}
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">4h ago</span>
          </div>
          
          <p className={cn(
            "mt-2 text-[15px] text-gray-900 whitespace-pre-wrap break-words",
            ibmPlexSans.className
          )}>
            {comment.content}
          </p>
          
          <div className="mt-3 flex items-center gap-3 text-gray-500">
            {show && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs mr-2",
                  balanceColor
                )}
              >
                balance: {balance.toLocaleString()}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-gray-500 hover:text-gray-700 h-8 px-2"
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              Reply
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="text-gray-500 hover:text-gray-700 h-8 px-2"
            >
              <Heart className="h-4 w-4 mr-1.5" />
              {likeCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-500 hover:text-gray-700 h-8 px-2"
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Share
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 h-8 px-2"
            >
              <Award className="h-4 w-4 mr-1.5" />
              Award
            </Button>
          </div>

          {showReplyForm && (
            <div className="mt-4">
              <WriteComment
                parentId={comment.id || ""}
                newsAddress={newsAddress}
                onCommentSent={() => {
                  setShowReplyForm(false)
                  onCommentSent()
                }}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-4">
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

function FeaturedComment({ author, content, status, balance }: { 
  author: string; 
  content: string; 
  status: "positive" | "negative";
  balance: {
    positiveBalance?: string;
    negativeBalance?: string;
    saleBalance?: string;
  };
}) {
  const badgeColor = status === "positive" ? "bg-red-500" : "bg-blue-500"
  const badgeText = status === "positive" ? "Positive" : "Negative"
  
  const tokenAmount = status === "positive" 
    ? balance.positiveBalance || balance.saleBalance
    : balance.negativeBalance || balance.saleBalance;

  return (
    <div className="rounded-[23px] bg-white shadow-[0px_4px_36px_0px_rgba(0,0,0,0.09)] p-3 pt-5 pb-5 mb-6 w-1/2">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12">
          <GradationIcon address={author} size={48} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`font-medium ${ibmPlexSans.className}`}>{author}</span>
            <Badge variant="secondary" className={`${badgeColor} text-white rounded-full px-2 py-0.5 text-xs`}>
              {badgeText}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Coins className="w-4 h-4" />
              <span className={ibmPlexSans.className}>{tokenAmount} tokens</span>
            </div>
          </div>
          <p className={`text-[12px] text-gray-700 ${ibmPlexSans.className}`}>
            {content}
          </p>
        </div>
      </div>
    </div>
  )
}

interface Balance {
  positiveBalance?: string;
  negativeBalance?: string;
  saleBalance?: string;
}

interface CommentNode extends Comment {
  replies: CommentNode[];
  balance: Balance;
}

function CommentTreeSkeleton() {
  return (
    <div className="space-y-8">
      {Array(3).fill(null).map((_, index) => (
        <div key={index} className="group mb-6 mt-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 relative">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full animate-pulse" />
              <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-200" />
            </div>
            
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          <div className="pl-[52px] mt-2 relative">
  <div className="absolute left-5 top-0 w-[47px] h-6">
    <div className="absolute left-0 top-0 w-full h-full border-l-2 border-b-2 border-gray-200 rounded-bl-xl" />
  </div>
  
  <div className="space-y-4">
    {Array(2).fill(null).map((_, replyIndex) => (
      <div key={replyIndex} className="flex gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
      </div>
    ))}
  </div>
);
}

export default function Page() {
  const router = useRouter();
  const { address } = router.query;
  const news = useNewsStore((state) => state.news)
  const [metadata, setMetadata] = useState<SaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentTree, setCommentTree] = useState<CommentNode[]>([]);
  const [topComments, setTopComments] = useState<{
    topPositiveComment: CommentNode | null;
    topNegativeComment: CommentNode | null;
  }>({
    topPositiveComment: null,
    topNegativeComment: null
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const truncateDescription = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const fetchComments = async (isAdding = false) => {
    if (isLoadingComments && !isAdding) return;
    
    try {
      console.log('event/////')
      if (!isAdding) setIsLoadingComments(true);
      const response = await fetch(`/api/getCommentTree?address=${address}`);
      const result = await response.json();
      setCommentTree(result.tree);
      setTopComments({
        topPositiveComment: result.topPositiveComment,
        topNegativeComment: result.topNegativeComment
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
      setIsAddingComment(false);
    }
  }

  useEffect(() => {
    if (address) {
      const sale = news.find(sale => sale.saleContractAddress === address);
      if (sale) {
        setMetadata(sale)
        setLoading(false)
      }
    }
  }, [address, news]);

  useEffect(() => {
    if (address) {
      fetchComments();
    }
  }, [address]);

  const handleCommentSent = () => {
    setIsAddingComment(true);
    fetchComments(true);
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
          <div className="w-[70px]"></div>
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
                  <div className={`text-[13px] font-light ${ibmPlexSans.className}`}>
                    <p>
                      {isExpanded
                        ? metadata?.description
                        : truncateDescription(metadata?.description || "", 300)}
                    </p>
                    {(metadata?.description?.length || 0) > 300 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleExpand}
                        className="mt-2 text-blue-500 hover:text-blue-700"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Read More
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </article>

          <div className="mt-8">
            <div className="mb-8 flex gap-4">
              {topComments.topPositiveComment && (
                <FeaturedComment 
                  author={`${topComments.topPositiveComment.userAddress.slice(0, 6)}...${topComments.topPositiveComment.userAddress.slice(-4)}`}
                  content={topComments.topPositiveComment.content}
                  status="positive"
                  balance={topComments.topPositiveComment.balance}
                />
              )}
              {topComments.topNegativeComment && (
                <FeaturedComment 
                  author={`${topComments.topNegativeComment.userAddress.slice(0, 6)}...${topComments.topNegativeComment.userAddress.slice(-4)}`}
                  content={topComments.topNegativeComment.content}
                  status="negative"
                  balance={topComments.topNegativeComment.balance}
                />
              )}
            </div>

            <WriteComment parentId={""} newsAddress={address as string} onCommentSent={handleCommentSent} />
          </div>

          <div className="space-y-8 mt-6">
            {isLoadingComments && !isAddingComment ? (
              <CommentTreeSkeleton />
            ) : (
              <div className="w-[80%] mx-auto">
                {commentTree.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    newsAddress={address as string}
                    onCommentSent={handleCommentSent}
                    depth={0}
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

