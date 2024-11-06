import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is not set')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("--- api/uploadIcon -------")
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { privyId, icon } = req.body

  if (!icon) {
    return res.status(400).json({ message: 'Missing privyId or icon' })
  }
  const fileName = privyId ? `${privyId}-icon-${Date.now()}.png` : generateRandomName(6);

  try {
    // Base64データから 'data:image/png;base64,' などのプレフィックスを削除
    const base64Data = icon.split(',')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    console.log(fileName)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-profile-icon')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: true })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from('user-profile-icon')
      .getPublicUrl(fileName)

    const iconUrl = urlData.publicUrl
    console.log("iconUrl", iconUrl)

    return res.status(200).json({ iconUrl })
  } catch (error) {
    console.error('Error uploading icon:', error)
    return res.status(500).json({ message: 'Error uploading icon' })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb' // または必要なサイズに応じて調整
    }
  }
}

function generateRandomName(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

