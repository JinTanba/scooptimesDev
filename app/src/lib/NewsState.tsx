import { create } from 'zustand';
import { News, SaleData } from '@/types';
import { calcMarketcap, getEthPrice } from './UniswapRouter';
import { createClient } from '@supabase/supabase-js';
import { provider, ramdomProvider } from './utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Supabase URL or Service Role Key is not set');
}

// Realtime有効化オプションを追加
const supabase = createClient(supabaseUrl, anonKey);

async function fetchSaleDataFromSupabase() {
  const { data, error } = await supabase.from('saleData').select('*');
  if (error) {
    console.error('Error fetching saleData:', error);
    return [];
  }
  const saleData = data as SaleData[];
  return saleData.reverse();
}

const calculateMarketcap = async (sale: SaleData, currentEthPrice: number) => {
  const [positiveMarketcap, negativeMarketcap] = sale.launched
    ? await Promise.all([
        calcMarketcap(sale.positivePairAddress, sale.positiveToken, ramdomProvider(), currentEthPrice),
        calcMarketcap(sale.negativePairAddress, sale.negativeToken, ramdomProvider(), currentEthPrice),
      ])
    : [0, 0];
  return { ...sale, positiveMarketcap, negativeMarketcap };
};

type NewsState = {
  news: SaleData[];
  addNews: (news: SaleData) => void;
  updateNews: (saleAddress: string, totalRaised: string) => void;
  launchNews: (saleAddress: string) => void;
  initializeEventListeners: () => void;
  startPolling: () => void;
  stopPolling: () => void;
};

export const useNewsStore = create<NewsState>((set, get) => ({
  news: [],
  addNews: (news: SaleData) => set((state) => ({ news: [news, ...state.news] })),
  updateNews: (saleAddress: string, totalRaised: string) =>
    set((state) => ({
      news: state.news.map((n) =>
        n.saleContractAddress.toLowerCase() === saleAddress.toLowerCase() ? { ...n, totalRaised } : n
      ),
    })),
  launchNews: (saleAddress: string) =>
    set((state) => ({
      news: state.news.map((n) =>
        n.saleContractAddress.toLowerCase() === saleAddress.toLowerCase() ? { ...n, launched: true } : n
      ),
    })),
  initializeEventListeners: async () => {
    console.log('initializeEventListeners');
    const fetchedNews = await fetchSaleDataFromSupabase();
    const currentEthPrice = await getEthPrice();
    const newNews = await Promise.all(
      fetchedNews.map(async (item) => {
        return await calculateMarketcap(item, currentEthPrice);
      })
    );

    const sortedNews = [...newNews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    set({ news: sortedNews });

    // テーブル変更を購読するチャネル設定
    const channel = supabase
      .channel('public:saleData-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saleData' },
        async (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          let updatedNews = get().news;
          let updatedItem: SaleData | null = null;
          if (eventType === 'INSERT' && newRecord) {
            // 新規レコード追加
            console.log('INSERT', newRecord)
            updatedItem = newRecord as SaleData
            
          } else if (eventType === 'UPDATE' && newRecord) {
            // 既存レコード更新
            console.log('UPDATE', newRecord)
            updatedItem = newRecord as SaleData
            
          } else if (eventType === 'DELETE' && oldRecord) {
            // レコード削除
            console.log('DELETE', oldRecord)
            updatedNews = updatedNews.filter(
              (item) => item.saleContractAddress.toLowerCase() !== oldRecord.saleContractAddress.toLowerCase()
            );
          }
          console.log('updatedItem^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^')
          const updateOrder = (state:NewsState) => {
            let updatedNews: SaleData[] = []
            if(updatedItem) {
                console.log('BOOOOOOOM', updatedItem)
               updatedNews = [updatedItem as SaleData, ...state.news.filter(item => item.saleContractAddress !== updatedItem?.saleContractAddress)]
            }else {
               updatedNews = [...state.news]
            }
            return {news: updatedNews}
          }
          set(updateOrder)
        }
      )
      .subscribe((status) => {
        console.log('Supabase subscription status:', status);
      });

    console.log('💣💣🔥💣💣🔥💣💣🔥💣💣🔥 Event Listeners Initialized');
  },
  startPolling: () => {},
  stopPolling: () => {},
}));
