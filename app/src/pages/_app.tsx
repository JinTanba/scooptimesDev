import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LazyMotion, domAnimation } from "framer-motion";
import WalletConnector from "@/lib/walletConnector";
import { useState } from "react";
import { ethers } from "ethers";

export default function App({ Component, pageProps }: AppProps) {
  const [wallet, setWallet] = useState<ethers.Signer | null>(null);
  return (

    <div className="bg-white min-h-screen max-w-screen overflow-hidden">
      <div className="flex justify-end">
        <WalletConnector onWalletChange={setWallet} />
      </div>
    <LazyMotion features={domAnimation}>
      {wallet && <Component {...pageProps} wallet={wallet} />}
      </LazyMotion>
    </div>
  );
}
