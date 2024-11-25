import {create} from 'zustand';
import { ethers } from 'ethers';
import { News } from '@/types';

const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");

type NewsState = {
  news: News[];
  addNews: (news: News) => void;
  updateNews: (saleAddress: string, totalRaised: string) => void;
  launchNews: (saleAddress: string) => void;
  initializeEventListeners: (factoryAddress: string) => void;
}

export const useNewsStore = create<NewsState>((set) => ({
  news: [],
  addNews: (news: News) => set((state) => ({ 
    news: [news, ...state.news] 
  })),
  updateNews: (saleAddress: string, totalRaised: string) => set((state) => ({
    news: state.news.map(n => 
      n.saleContractAddress.toLowerCase() === saleAddress.toLowerCase()
        ? { ...n, totalRaised }
        : n
    )
  })),
  launchNews: (saleAddress: string) => set((state) => ({
    news: state.news.map(n =>
      n.saleContractAddress.toLowerCase() === saleAddress.toLowerCase()
        ? { ...n, launched: true }
        : n
    )
  })),
  initializeEventListeners: async(factoryAddress: string) => {
    console.log('initializeEventListeners initializeEventListeners initializeEventListeners')
    let data = await fetch('/api/getNews');
    let jsondata = await data.json() 
    if(!jsondata?.data) return [];
    const sale = jsondata.data.sales;
    set({ news: [...sale] })
    const factory = new ethers.Contract(
      factoryAddress,
      [
        "event SaleCreated(address indexed saleContractAddress, address indexed creator, string name, string symbol, uint256 saleGoal, string logoUrl, string websiteUrl, string twitterUrl, string telegramUrl, string description, string[] relatedLinks)",
        "event TokensBought(address indexed saleContractAddress, address indexed buyer, uint256 totalRaised, uint256 tokenBalance)",
        "event SaleLaunched(address indexed saleContractAddress, address indexed launcher)",
        "event TokensSold(address indexed saleContractAddress, address indexed seller, uint256 tokenAmount, uint256 ethAmount, uint256 timestamp)",
      ],
      provider
    );
    
    // factory.on("TokensBought", (
    //     saleContractAddress: string,
    //     buyer: string,
    //     totalRaised: ethers.BigNumber,
    //     tokenBalance: ethers.BigNumber,
    //   ) => {
    //     console.log("detect tokenBounght", saleContractAddress, buyer, totalRaised.toString())
    //     set((state) => ({
    //       news: state.news.map(n =>
    //         n.saleContractAddress.toLowerCase() === saleContractAddress.toLowerCase()
    //           ? { ...n, totalRaised: ethers.utils.formatEther(totalRaised) }
    //           : n
    //       )
    //     }));
    //   });

  }
}));