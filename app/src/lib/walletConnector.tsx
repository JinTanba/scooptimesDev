// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { ethers } from "ethers";

const WalletConnector = ({ onWalletChange }: { onWalletChange: (signer: ethers.Signer | null) => void }) => {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const baseSepolia = {
    chainId: "0xaa36a7",
    chainName: "Sepolia",
    rpcUrls: ["https://sepolia.infura.io/v3/4d95e2bfc962495dafdb102c23f0ec65"],
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    },
    blockExplorerUrls: ["https://sepolia.etherscan.io/"]
  };

  const disconnectWallet = async () => {
    try {
      setAccount("");
      setChainId("");
      onWalletChange(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError("");

      if (!window.ethereum) {
        throw new Error("Please install MetaMask to use this feature");
      }

      // This will open MetaMask popup for account selection
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      // Get the current chain ID
      const chainId = await window.ethereum.request({
        method: "eth_chainId"
      });

      // Check if we're on Base Sepolia
      if (chainId !== "0xaa36a7") {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }]
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [baseSepolia]
            });
          } else {
            throw switchError;
          }
        }
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      setAccount(accounts[0]);
      setChainId(chainId);
      onWalletChange(signer);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          connectWallet();
        }
      });

      window.ethereum.on("chainChanged", () => {
        connectWallet();
      });
    }
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", connectWallet);
        window.ethereum.removeListener("chainChanged", connectWallet);
      }
    };
  }, []);

  return (
    <div className="mb-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {account ? (
        <div className="space-y-4">
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
          className="w-full"
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
  );
};

export default WalletConnector;