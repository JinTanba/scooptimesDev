import { create } from 'zustand';
import { ethers } from 'ethers';
import { News, SaleData } from '@/types';
import { calcMarketcap } from './UniswapRouter';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Supabase URL or Service Role Key is not set');
}

const supabase = createClient(supabaseUrl, anonKey);

async function fetchSaleData() {
  const { data, error } = await supabase.from('saleData').select('*');
  return data as SaleData[];
}


type NewsState = {
  news: SaleData[];
  addNews: (news: SaleData) => void;
  updateNews: (saleAddress: string, totalRaised: string) => void;
  launchNews: (saleAddress: string) => void;
  initializeEventListeners: (factoryAddress: string) => void;
  startPolling: () => void;
  stopPolling: () => void;
}

// @ts-ignore
export const useNewsStore = create<NewsState>((set: any) => {

  const fetchInitialData = async () => {
    try {
      const saleData = await fetchSaleData();
      console.log(saleData);

      const reversedSaleData = saleData.reverse();
      set({ news: reversedSaleData });
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

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
    initializeEventListeners: async (factoryAddress: string) => {
      console.log("initializeEventListeners")
      await fetchInitialData();
      //supabaseの購読
      supabase.channel('saleData').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'saleData' }, (payload) => {
        console.log('Payload:', payload);
      }).subscribe();
    }
  };
});