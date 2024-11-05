import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from "next";

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is not set')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
  ) {

}