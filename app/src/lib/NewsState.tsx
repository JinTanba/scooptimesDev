import { create } from 'zustand';
import { ethers } from 'ethers';
import { News, SaleData } from '@/types';
import { calcMarketcap, getEthPrice } from './UniswapRouter';
import { createClient } from '@supabase/supabase-js';
import { provider } from './utils';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Supabase URL or Service Role Key is not set');
}

const supabase = createClient(supabaseUrl, anonKey);

async function fetchSaleData(owner: string) {
  const res = await fetch(`/api/getNews?owner=${owner}`);
  const data = await res.json();
  return data as SaleData[];
}

const calculateMarketcap = async (sale: SaleData, currentEthPrice: number) => {
  console.log(sale.launched, typeof sale.launched)
  const [positiveMarketcap, negativeMarketcap] = sale.launched ? await Promise.all([
    calcMarketcap(sale.positivePairAddress, sale.positiveToken, provider, currentEthPrice),
    calcMarketcap(sale.negativePairAddress, sale.negativeToken, provider, currentEthPrice)
  ]) : [0, 0];
  return { ...sale, positiveMarketcap, negativeMarketcap };
}


type NewsState = {
  news: SaleData[];
  addNews: (news: SaleData) => void;
  updateNews: (saleAddress: string, totalRaised: string) => void;
  launchNews: (saleAddress: string) => void;
  initializeEventListeners: () => void;
  startPolling: () => void;
  stopPolling: () => void;
}

// @ts-ignore
export const useNewsStore = create<NewsState>((set: any) => {

  const fetchSaleData = async () => {
    const data = await supabase.from('saleData').select('*');
    const saleData = data.data as SaleData[];
    const reversedSaleData = [...saleData].reverse();
    return reversedSaleData;
  }

  return {
    news: [],
    addNews: (news: News) => set((state:any) => ({ news: [news, ...state.news] })),
    updateNews: (saleAddress: string, totalRaised: string) => 
      set((state:any) => ({
        news: state.news.map((n:any) => 
          n.saleContractAddress.toLowerCase() === saleAddress.toLowerCase()
            ? { ...n, totalRaised }
            : n
        )
      })),
    launchNews: (saleAddress: string) => 
      set((state: any) => ({
        news: state.news.map((n: any) =>
          n.saleContractAddress.toLowerCase() === saleAddress.toLowerCase()
            ? { ...n, launched: true }
            : n
        )
      })),
    initializeEventListeners: async (owner: string) => {
      console.log("initializeEventListeners")
      const news = await fetchSaleData();
      set({ news: news })
      const currentEthPrice = await getEthPrice()
      const newNews = await Promise.all(news.map(async item => {
        console.log("🔥", item)
        const news = await calculateMarketcap(item, currentEthPrice);
        return {...item, positiveMarketcap: news.positiveMarketcap, negativeMarketcap: news.negativeMarketcap}
      }))
      console.log('change global state!!!!!!')
      set({ news: [...newNews] })
      supabase.channel('saleData').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'saleData' }, (payload) => {
        console.log('Payload:', payload);
      }).subscribe();
    }
  };
});