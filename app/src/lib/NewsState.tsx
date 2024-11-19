import {create} from 'zustand';
import { ethers } from 'ethers';
import { News } from '@/types';


const testPrivateKey = "68bf6ec02461aecaa2d401ff255a39dc1f97a23f4755837b0a06391513101846";
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");
const testWallet = new ethers.Wallet(testPrivateKey, provider);
const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c";

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
    console.log("sale!!!!!!", sale);
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

    factory.on("SaleCreated", async (
      saleContractAddress: string,
      creator: string,
      name: string,
      symbol: string,
      saleGoal: ethers.BigNumber,
      logoUrl: string,
      websiteUrl: string,
      twitterUrl: string,
      telegramUrl: string,
      description: string,
      event: ethers.Event
    ) => {
      console.log("hello")
      const newSale: News = {
        saleContractAddress,
        creator,
        name,
        symbol,
        saleGoal: ethers.utils.formatEther(saleGoal),
        logoUrl,
        websiteUrl,
        twitterUrl,
        telegramUrl,
        description,
        blockNumber: event.blockNumber?.toString(),
        transactionHash: event.transactionHash,
        totalRaised: "0",
        launched: false
      };
      set((state) => ({ news: [newSale, ...state.news] }));
    });


    factory.on("TokensBought", (
        saleContractAddress: string,
        buyer: string,
        totalRaised: ethers.BigNumber,
        tokenBalance: ethers.BigNumber,
      ) => {
        console.log("detect tokenBounght")
        set((state) => ({
          news: state.news.map(n =>
            n.saleContractAddress.toLowerCase() === saleContractAddress.toLowerCase()
              ? { ...n, totalRaised: ethers.utils.formatEther(totalRaised) }
              : n
          )
        }));
      });
  
      factory.on("SaleLaunched", (
        saleContractAddress: string,
        launcher: string,
      ) => {
        set((state) => ({
          news: state.news.map(n =>
            n.saleContractAddress.toLowerCase() === saleContractAddress.toLowerCase()
              ? { ...n, launched: true }
              : n
          )
        }));
      });
  }
}));