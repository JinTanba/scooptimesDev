import { calcMarketcap, getEthPrice } from "@/lib/UniswapRouter";
import { provider } from "@/lib/utils";
import { SaleData } from "@/types";
import { createClient } from "@supabase/supabase-js";
import { ethers } from "ethers";
import { NextApiRequest, NextApiResponse } from "next";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Supabase URL or Service Role Key is not set');
}

const supabase = createClient(supabaseUrl, anonKey);

async function fetchSaleData() {
  const [data, ethPrice] = await Promise.all([supabase.from('saleData').select('*'), getEthPrice()]);
  const sales = data.data as SaleData[];
  const salesInMarketCaps = await Promise.all([...sales].map(async sale=>{
    const [positiveMarketcap, negativeMarketcap] = sale.launched ? await Promise.all([calcMarketcap(sale.positivePairAddress, sale.negativePairAddress, provider, ethPrice), calcMarketcap(sale.negativePairAddress, sale.negativeToken, provider, ethPrice)]) : [0, 0];
    return {
      ...sale,
      positiveMarketcap,
      negativeMarketcap
    } as SaleData
  }))
  return salesInMarketCaps;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sales = await fetchSaleData();
  console.log("sales", sales)
  res.status(200).json(sales);
}