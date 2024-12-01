import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AnimatePresence, LazyMotion, domAnimation, motion } from "framer-motion";
import useMetaMaskWallet, { useSignerStore } from "@/lib/walletConnector";
import { Menu, Loader2, ChevronDown, User, LogOut } from "lucide-react";
import { ethers } from "ethers";
import { useEffect, useReducer, useState } from "react";
import { News } from "@/types";
import { useNewsStore } from "@/lib/NewsState";
import router from "next/router";

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



export default function App({ Component, pageProps }: AppPropsWithWallet) {
  const initializeEventListeners = useNewsStore(state => state.initializeEventListeners);

   useEffect(() => {
     console.log("Hi")
     console.log("initializeEventListeners")
     initializeEventListeners(factoryAddress);
   }, []);

  const {
    error,
    connectWallet,
    disconnectWallet,
    switchAccount
  } = useMetaMaskWallet(false);

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

const ConnectWallt = ({ signer, disconnectWallet }: { signer: ethers.Signer, disconnectWallet: () => void }) => {
  const [address, setAddress] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [colors, setColors] = useState({ from: '#000', to: '#000' });

  useEffect(() => {
    const fetchAddress = async () => {
      if (signer) {
        const _address = await signer.getAddress();
        setAddress(_address);
        // アドレスから色を生成
        const start = _address.slice(2, 8);
        const end = _address.slice(-6);
        setColors({
          from: `#${start}`,
          to: `#${end}`
        });
      }
    };
    fetchAddress();
  }, [signer]);

  const handleConnect = async () => {
    if (!signer) {
      // ウォレット接続処理
      // 実装はウォレットプロバイダーに依存
    }
  };

  if (!address) {
    return (
      <button
        onClick={handleConnect}
        className="px-4 py-2 rounded-full text-white font-medium"
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
        }}
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 rounded-full text-white font-medium"
        style={{
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`
        }}
      >
        <span>{`${address.slice(0, 5)}...${address.slice(-4)}`}</span>
        <ChevronDown 
          size={16} 
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white overflow-hidden"
          >
            <button
              onClick={() => router.push(`/myPage`)}
              className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <User size={16} className="mr-2" />
              My Page
            </button>
            <button
              onClick={disconnectWallet}
              className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-100"
            >
              <LogOut size={16} className="mr-2" />
              Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
