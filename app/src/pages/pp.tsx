'use client'

import { useState, useEffect } from "react"
import { Search, Send, MessageCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from "next/router"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import TokenTrade from "@/components/TokenTrade"
import { useSignerStore } from "@/lib/walletConnector"
import { Header } from "@/components/Header"

// Supabase setup
const supabaseUrl = "https://lipbpiidmsjeuqemorzv.supabase.co"
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcGJwaWlkbXNqZXVxZW1vcnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5MjE2MDksImV4cCI6MjA0NzQ5NzYwOX0.9u0nQ_2W99oFAfUMBp8KMyrQLfFkko55mgaV7AygzFU"
const supabase = createClient(supabaseUrl, anonKey);

// Types
interface Comment {
  id?: string;
  newsAddress: string;
  content: string;
  userAddress: string;
  parentId: string;
  likeCount: number;
}

interface SaleMetadata {
  creator: string;
  saleGoal: string;
  logoUrl: string;
  description: string;
  name: string;
}

// Comment submission function
async function sendComment({content, wallet, parentId, newsAddress}: {
  content: string;
  wallet: ethers.Signer;
  parentId: string;
  newsAddress: string;
}) {
  const userAddress = await wallet.getAddress();
  const comment: Comment = {
    content,
    userAddress,
    parentId,
    newsAddress,
    likeCount: 0,
  }
  await fetch("/api/createComment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({comment}),
  });
}

function WriteComment({ parentId, newsAddress, onCommentSent }: { 
  parentId: string;
  newsAddress: string;
  onCommentSent: () => void;
}) {
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
      <Input 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="comment"
        className="w-full rounded-[22px] border-[#BFBFBF] bg-white pr-12"
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
  );
}

function CommentThread({ comment, newsAddress, onCommentSent }: {
  comment: Comment;
  newsAddress: string;
  onCommentSent: () => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const formattedAddress = `${comment.userAddress.slice(0, 6)}...${comment.userAddress.slice(-4)}`;

  return (
    <div className="flex gap-4">
      <Avatar>
        <AvatarImage src="/placeholder.svg?height=40&width=40" />
        <AvatarFallback>UN</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{formattedAddress}</span>
          <span className="text-xs text-blue-600 font-medium">NeG</span>
        </div>
        <p className="text-sm mb-2">{comment.content}</p>
        <div className="flex gap-2 items-center">
          <Badge variant="secondary" className="bg-blue-100 text-blue-600 rounded-full">
            Likes: {comment.likeCount}
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
  );
}

export default function ArticlePage() {
  const router = useRouter();
  const { address } = router.query;
  const [metadata, setMetadata] = useState<SaleMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const ibmPlexSansJP = { className: "font-['IBM_Plex_Sans_JP']" };

  const fetchComments = async () => {
    if (!address) return;
    const { data, error } = await supabase
      .from('comment')
      .select()
      .eq('newsAddress', address)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }
    setComments(data || []);
  };

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
          console.error("Error:", error);
          setLoading(false);
        });
      fetchComments();
    }
  }, [address]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`flex justify-center ${ibmPlexSansJP.className}`}>
      <div className="w-1/2 p-6 -ml-[200px]">
        <Header/>
        
        <main>
          <article className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <img 
                src={metadata?.logoUrl || "/placeholder.svg?height=105&width=105"}
                alt="Article thumbnail"
                className="w-[105px] h-[105px] rounded-full object-cover"
              />
              <h2 className="text-3xl md:text-[41px] font-['Times_New_Roman',_Times,_serif] font-normal leading-tight">
                {metadata?.name || "Loading..."}
              </h2>
            </div>
            
            <p className="text-sm font-light mb-8">
              {metadata?.description || "Loading..."}
            </p>

            <div className="space-y-6">
              <WriteComment 
                parentId="" 
                newsAddress={address as string} 
                onCommentSent={fetchComments}
              />

              <div className="space-y-6">
                {comments.map((comment, index) => (
                  <CommentThread
                    key={comment.id || index}
                    comment={comment}
                    newsAddress={address as string}
                    onCommentSent={fetchComments}
                  />
                ))}
              </div>
            </div>
          </article>
        </main>
      </div>

      <TokenTrade />
    </div>
  );
}