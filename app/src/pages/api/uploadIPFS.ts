import type { NextApiRequest, NextApiResponse } from "next";
import { PinataSDK } from "pinata-web3"
import formidable from 'formidable';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is not set')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
export const pinata = new PinataSDK({
  pinataJwt: `${process.env.PINATA_JWT}`,
  pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`
})

console.log("pinata", process.env.PINATA_JWT);
console.log("gateway", process.env.NEXT_PUBLIC_GATEWAY_URL);
// upload image to ipfs
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
    console.log("=================================================")
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
    
      try {
        // formidableを使用してファイルをパース
        const base64Data = req.body.split(',')[1];
        console.log("base64Data", base64Data);
        const buffer = Buffer.from(base64Data, 'base64');
        const fileName = `${Date.now()}_${Math.random()}.png`
        const { data: supaBaseData, error: uploadError } = await supabase.storage
        .from('user-profile-icon')
        .upload(fileName, buffer, { contentType: 'image/png', upsert: true })
  
      if (uploadError) throw uploadError
  
      const { data: urlData } = supabase.storage
        .from('user-profile-icon')
        .getPublicUrl(fileName)
      console.log("urlData", urlData)
        const iconUrl = urlData.publicUrl
        console.log("iconUrl", iconUrl)

        console.log('5')
        // // Pinataにアップロード
        // const upload = await pinata.upload.url(iconUrl)
        // console.log("upload", upload)

    
        return res.status(200).json(iconUrl);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

}
