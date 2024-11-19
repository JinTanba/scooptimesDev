import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LazyMotion, domAnimation } from "framer-motion";
import useMetaMaskWallet, { useSignerStore } from "@/lib/walletConnector";
import { Menu, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { useEffect, useReducer, useState } from "react";
import { News } from "@/types";
import { useNewsStore } from "@/lib/NewsState";

interface WalletProps {
  wallet: ethers.Signer;
}

type AppPropsWithWallet = AppProps & {
  Component: React.ComponentType<WalletProps>;
};


const testPrivateKey = "68bf6ec02461aecaa2d401ff255a39dc1f97a23f4755837b0a06391513101846";
const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65");
const testWallet = new ethers.Wallet(testPrivateKey, provider);
const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c";

type NewsAction = 
  | { type: 'INIT_NEWS'; payload: News[] }
  | { type: 'ADD_NEWS'; payload: News }
  | { type: 'UPDATE_NEWS'; payload: { saleContractAddress: string; totalRaised: string } }
  | { type: 'LAUNCH_NEWS'; payload: { saleContractAddress: string } };

function newsReducer(state: News[], action: NewsAction): News[] {
  switch (action.type) {
    case 'INIT_NEWS':
      return action.payload;

    case 'ADD_NEWS':
      return [action.payload, ...state];

    case 'UPDATE_NEWS': {
      const { saleContractAddress, totalRaised } = action.payload;
      const existingNewsIndex = state.findIndex(
        news => news.saleContractAddress.toLowerCase() === saleContractAddress.toLowerCase()
      );

      if (existingNewsIndex === -1) return state;

      const existingNews = state[existingNewsIndex];
      const updatedNews = {
        ...existingNews,
        totalRaised
      };

      // 古いニュースを削除して新しいニュースを先頭に追加
      const newState = [...state];
      newState.splice(existingNewsIndex, 1);
      return [updatedNews, ...newState];
    }

    case 'LAUNCH_NEWS': {
      const { saleContractAddress } = action.payload;
      return state.map(news => 
        news.saleContractAddress.toLowerCase() === saleContractAddress.toLowerCase()
          ? { ...news, launched: true }
          : news
      );
    }

    default:
      return state;
  }
}


export default function App({ Component, pageProps }: AppPropsWithWallet) {
  const initializeEventListeners = useNewsStore(state => state.initializeEventListeners);
  const news = useNewsStore(state => state.news);
   useEffect(() => {
     if(news.length > 0) return;
     initializeEventListeners(factoryAddress);
   }, []);

  const {
    error,
    connectWallet,
    disconnectWallet,
    switchAccount
  } = useMetaMaskWallet(false);

  const [asigner, setSigner] = useState<ethers.Signer>();

  const signer = useSignerStore(state => state.signer);


  return (
    <div className="bg-white min-h-screen max-w-screen overflow-hidden text-black">
      <div className="fixed top-0 right-0 p-4 z-50">        
          {!signer ? (<button
            onClick={connectWallet}
            className="flex items-center space-x-2 text-sm hover:opacity-80 transition-opacity bg-white rounded-full shadow-md px-3 py-2"
          >
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600">Connect</span>
          </button>) : (
            <ConnectWallt signer={signer} disconnectWallet={disconnectWallet}/>
          )}
      </div>

      <LazyMotion features={domAnimation}>
         <Component {...pageProps}/>
      </LazyMotion>
    </div>
  );
}

function ConnectWallt({signer, disconnectWallet}:{signer: ethers.Signer, disconnectWallet: () => Promise<void>}) {
  const [address, setAddress] = useState("");
  useEffect(() => {
    (async() => {
      const _address = await signer.getAddress();
      setAddress(_address);
    })()
  },[])
  return (
    <button
    onClick={disconnectWallet}
    className="flex items-center space-x-2 text-sm hover:opacity-80 transition-opacity bg-white rounded-full shadow-md px-3 py-2"
  >
    <div className="w-2 h-2 rounded-full bg-green-500" />
    <span className="text-gray-600">{`${address.slice(0,5)}...${address.slice(address.length-4,address.length)}`}</span>
  </button>
  )
}