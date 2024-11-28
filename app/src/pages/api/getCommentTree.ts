import { NextApiRequest, NextApiResponse } from 'next'
import { ethers } from 'ethers'
import { createClient } from '@supabase/supabase-js'
import newsArtifact from "../../EtherfunSale.json"

const supabaseUrl = "https://lipbpiidmsjeuqemorzv.supabase.co"
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcGJwaWlkbXNqZXVxZW1vcnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5MjE2MDksImV4cCI6MjA0NzQ5NzYwOX0.9u0nQ_2W99oFAfUMBp8KMyrQLfFkko55mgaV7AygzFU"
const supabase = createClient(supabaseUrl, anonKey)
const zeroAddress = "0x0000000000000000000000000000000000000000"

interface Balance {
  positiveBalance?: string
  negativeBalance?: string
  saleBalance?: string
}

interface Comment {
  id: number
  content: string
  userAddress: string
  parentId: string | null
  newsAddress: string
  likeCount: number
  created_at?: string
}

interface CommentNode extends Comment {
  replies: CommentNode[]
  balance: Balance
}

interface TreeMetadata {
  weight: number
  maxPositive: {
    amount: number
    node: CommentNode | null
  }
  maxNegative: {
    amount: number
    node: CommentNode | null
  }
}

interface CommentTreeResult {
  tree: CommentNode[]
  isLaunched: boolean
  topPositiveComment: CommentNode | null
  topNegativeComment: CommentNode | null
}

async function getBalance(newsAddress: string, userAddress: string, positiveToken?: string, negativeToken?: string): Promise<Balance> {
  const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65")
  const newsContract = new ethers.Contract(newsAddress, newsArtifact.abi, provider)
  const balance = await newsContract.tokenBalances(userAddress).then((b: any) => b.toString())

  if (!(positiveToken && negativeToken)) {
    return {
      saleBalance: Number(ethers.utils.formatEther(balance)).toFixed(2)
    }
  }

  const positiveTokenContract = new ethers.Contract(positiveToken, ["function balanceOf(address) view returns (uint256)"], provider)
  const negativeTokenContract = new ethers.Contract(negativeToken, ["function balanceOf(address) view returns (uint256)"], provider)

  const [positiveBalance, negativeBalance] = await Promise.all([
    positiveTokenContract.balanceOf(userAddress),
    negativeTokenContract.balanceOf(userAddress)
  ])

  return {
    positiveBalance: Number(ethers.utils.formatEther(positiveBalance)).toFixed(2),
    negativeBalance: Number(ethers.utils.formatEther(negativeBalance)).toFixed(2)
  }
}

function processTree(node: CommentNode, cache: Map<number, TreeMetadata>): TreeMetadata {
  if (cache.has(Number(node.id))) {
    return cache.get(Number(node.id))!
  }

  const positiveAmount = node.balance.positiveBalance ? parseFloat(node.balance.positiveBalance) : 0
  const negativeAmount = node.balance.negativeBalance ? parseFloat(node.balance.negativeBalance) : 0
  const saleAmount = node.balance.saleBalance ? parseFloat(node.balance.saleBalance) : 0

  let metadata: TreeMetadata = {
    weight: positiveAmount + negativeAmount + saleAmount,
    maxPositive: {
      amount: positiveAmount,
      node: positiveAmount > 0 ? node : null
    },
    maxNegative: {
      amount: negativeAmount,
      node: negativeAmount > 0 ? node : null
    }
  }

  node.replies.forEach(reply => {
    const childMetadata = processTree(reply, cache)
    metadata.weight += childMetadata.weight * 0.5
    
    if (childMetadata.maxPositive.amount > metadata.maxPositive.amount) {
      metadata.maxPositive = childMetadata.maxPositive
    }
    if (childMetadata.maxNegative.amount > metadata.maxNegative.amount) {
      metadata.maxNegative = childMetadata.maxNegative
    }
  })

  cache.set(Number(node.id), metadata)
  return metadata
}

async function buildCommentTree(address: string): Promise<CommentTreeResult> {
  const { data: comments, error } = await supabase
    .from('comment')
    .select()
    .eq('newsAddress', address)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    return {
      tree: [],
      isLaunched: false,
      topPositiveComment: null,
      topNegativeComment: null
    }
  }

  const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/63b354d57387411191e8c4819970577b")
  const newsContract = new ethers.Contract(address, newsArtifact.abi, provider)
  const [positiveToken, negativeToken] = await Promise.all([
    newsContract.positiveToken(),
    newsContract.negativeToken()
  ])

  const isLaunched = positiveToken !== zeroAddress

  const commentMap = new Map<number, CommentNode>()
  await Promise.all(
    comments.map(async (comment) => {
      const balance = await getBalance(
        comment.newsAddress,
        comment.userAddress,
        positiveToken === zeroAddress ? "" : positiveToken,
        negativeToken === zeroAddress ? "" : negativeToken
      )
      commentMap.set(Number(comment.id), {
        ...comment,
        balance,
        replies: []
      })
    })
  )

  const roots: CommentNode[] = []
  comments.forEach(comment => {
    const node = commentMap.get(Number(comment.id))
    if (node) {
      if (!comment.parentId) {
        roots.push(node)
      } else {
        const parentNode = commentMap.get(Number(comment.parentId))
        if (parentNode) {
          parentNode.replies.push(node)
        }
      }
    }
  })

  const metadataCache = new Map<number, TreeMetadata>()
  let globalMaxPositive = { amount: -1, node: null as CommentNode | null }
  let globalMaxNegative = { amount: -1, node: null as CommentNode | null }

  const sortedRoots = roots
    .map(root => {
      const metadata = processTree(root, metadataCache)
      
      if (metadata.maxPositive.amount > globalMaxPositive.amount) {
        globalMaxPositive = metadata.maxPositive
      }
      if (metadata.maxNegative.amount > globalMaxNegative.amount) {
        globalMaxNegative = metadata.maxNegative
      }
      
      return {
        root,
        weight: metadata.weight,
        created_at: root.created_at
      }
    })
    .sort((a, b) => {
      if (a.weight === b.weight) {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      return b.weight - a.weight
    })
    .map(item => item.root)

  return {
    tree: sortedRoots,
    isLaunched,
    topPositiveComment: globalMaxPositive.node,
    topNegativeComment: globalMaxNegative.node
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { address } = req.query

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ message: 'Address is required' })
  }

  try {
    const result = await buildCommentTree(address)
    res.status(200).json(result)
  } catch (error) {
    console.error('Error building comment tree:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}