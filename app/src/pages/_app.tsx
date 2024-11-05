import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LazyMotion, domAnimation } from "framer-motion";
import  useMetaMaskWallet  from "@/lib/walletConnector"; // フックをインポート
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ethers } from "ethers";

// WalletProps の型定義を追加
interface WalletProps {
  wallet: ethers.Signer;
}

// AppProps の型を拡張
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
    disconnectWallet
  } = useMetaMaskWallet(true); // 自動接続を有効化

  return (
    <div className="bg-white min-h-screen max-w-screen overflow-hidden">
      <div className="flex justify-end p-4">
        {error && (
          <Alert variant="destructive" className="mb-4 max-w-md">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {account ? (
          <div className="space-y-4 max-w-md">
            <Alert>
              <AlertTitle>Connected to MetaMask</AlertTitle>
              <AlertDescription>
                Account: {account.slice(0, 6)}...{account.slice(-4)}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={disconnectWallet}
              variant="destructive"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <Button 
            onClick={connectWallet} 
            disabled={isConnecting}
            className="w-full max-w-md"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect MetaMask'
            )}
          </Button>
        )}
      </div>

      <LazyMotion features={domAnimation}>
        {signer && <Component {...pageProps} wallet={signer} />}
      </LazyMotion>
    </div>
  );
}