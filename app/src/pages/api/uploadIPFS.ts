// pages/api/upload.ts
import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import { ethers } from 'ethers';
import crypto from 'crypto';

// formidableの設定をオーバーライド
export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = "https://lipbpiidmsjeuqemorzv.supabase.co"
const supabaseServiceRoleKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcGJwaWlkbXNqZXVxZW1vcnp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTkyMTYwOSwiZXhwIjoyMDQ3NDk3NjA5fQ.OmyjfLjmZA_FDWO5R54G5-UFgtmGr64Nj4Wf_CCZ63o"
console.log("👉uploadIPFS"); 
console.log(supabaseUrl);
console.log(supabaseServiceRoleKey);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is not set');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // formidableを使用してファイルを解析
    const form = formidable({});
    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // ファイル名をハッシュ化する部分を更新
    if(!file.originalFilename) file.originalFilename = "default.jpg";
    const fileNameHash = crypto.createHash('sha256')
        .update(file.originalFilename + Date.now().toString())
        .digest('hex');
    const fileName = `${Date.now()}_${fileNameHash.substring(0, 8)}`;
    console.log("🔥fileName", fileName);
    // ファイルを読み込む
    const fileBuffer = fs.readFileSync(file.filepath);

    // Supabaseのストレージにアップロード
    const { data, error } = await supabase
      .storage
      .from('images')
      .upload(fileName, fileBuffer, {
        contentType: file.mimetype || 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.log(error)
      return res.status(500).json({ error: error.message });
    }

    // アップロードされた画像のURLを取得
    const { data: { publicUrl } } = supabase
      .storage
      .from('images')
      .getPublicUrl(fileName);

    // 一時ファイルを削除
    fs.unlinkSync(file.filepath);

    return res.status(200).json({ 
      success: true, 
      url: publicUrl 
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}