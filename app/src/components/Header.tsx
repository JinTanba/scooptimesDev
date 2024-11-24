import React from 'react'
import { Button } from './ui/button'
import { Search } from 'lucide-react'
import { IBM_Plex_Serif, IBM_Plex_Sans } from "next/font/google"
import Image from "next/image"
import Link from "next/link"


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

export const Header = () => {
  return (
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
  )
}

