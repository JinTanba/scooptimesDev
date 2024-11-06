import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LazyMotion, domAnimation } from "framer-motion";
import useMetaMaskWallet from "@/lib/walletConnector";
import { Menu, Loader2 } from "lucide-react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

interface WalletProps {
  wallet: ethers.Signer;
}

type AppPropsWithWallet = AppProps & {
  Component: React.ComponentType<WalletProps>;
};

export default function App({ Component, pageProps }: AppPropsWithWallet) {
  const {
    account,
    signer,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchAccount
  } = useMetaMaskWallet(true);

  const [asigner, setSigner] = useState<ethers.Signer>();

  useEffect(() => {
    if (signer) setSigner(signer)
  },[signer])

  return (
    <div className="bg-white min-h-screen max-w-screen overflow-hidden text-black">
      <div className="fixed top-0 right-0 p-4 z-50">        
        {isConnecting ? (
          <div className="flex items-center space-x-2 text-sm bg-white rounded-full shadow-md px-3 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
            <span className="text-gray-600">Connecting...</span>
          </div>
        ) : account ? (
          <div className="relative group">
            <button className="flex items-center space-x-2 text-sm hover:opacity-80 transition-opacity bg-white rounded-full shadow-md px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">
                {`${account.slice(0, 6)}...${account.slice(-4)}`}
              </span>
              <Menu className="w-4 h-4 text-gray-600" />
            </button>
            
            <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
              <button
                onClick={switchAccount}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Switch Account
              </button>
              <button
                onClick={disconnectWallet}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="flex items-center space-x-2 text-sm hover:opacity-80 transition-opacity bg-white rounded-full shadow-md px-3 py-2"
          >
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600">Connect</span>
          </button>
        )}
      </div>

      <LazyMotion features={domAnimation}>
        {signer && <Component {...pageProps} wallet={asigner} />}
      </LazyMotion>
    </div>
  );
}