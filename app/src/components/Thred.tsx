import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { IBM_Plex_Sans } from "next/font/google"

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
})

interface CommentThreadProps {
  address: string
  content: string
  balance: number
  type?: 'PoS' | 'NeG'
  isTop?: boolean
}

export function CommentThread({ 
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
    <div className="flex gap-4 w-[70%] mx-auto">
      <Avatar className="h-10 w-10">
        <AvatarImage src="/placeholder.svg" />
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
        <p className={`mt-1 text-sm ${ibmPlexSans.className}`}>
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

export function CommentSection() {
  return (
    <div className="space-y-6 mt-6">
      <CommentThread
        address="0x8218....1821"
        content="We've spent two years examining the implications of a second Donald Trump presidency. He wants to radically reshape the federal government and consolidate executive power. He tried to do much of this in his first term but was largely stymied. Now, he's intent on hiring people less likely to say no."
        balance={100000}
        type="NeG"
        isTop={true}
      />
      {/* More comments can be added here */}
    </div>
  )
}