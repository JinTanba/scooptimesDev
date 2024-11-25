import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';
import { Comment } from '../../types';
const supabaseUrl = "https://lipbpiidmsjeuqemorzv.supabase.co"
const supabaseServiceRoleKey ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcGJwaWlkbXNqZXVxZW1vcnp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTkyMTYwOSwiZXhwIjoyMDQ3NDk3NjA5fQ.OmyjfLjmZA_FDWO5R54G5-UFgtmGr64Nj4Wf_CCZ63o"
if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is not set');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
    console.log("👉createComment",req.body);
    const {comment}: {comment: Comment} = req.body;
    const {data, error} = await supabase.from('comment').insert(comment).select().single();
    if (error) {
        console.error(error);
        res.status(500).json({error: "Failed to create comment"});
    } else {
        res.status(200).json({data});
    }

}