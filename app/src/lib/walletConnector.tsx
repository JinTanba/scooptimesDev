// stores/signerStore.ts
import { create } from 'zustand';
import { ethers } from 'ethers';
import { useState, useEffect, useCallback } from 'react';
interface SignerState {
  signer: ethers.Signer | null;
  setSigner: (signer: ethers.Signer | null) => void;
}

export const useSignerStore = create<SignerState>((set) => ({
  signer: null,
  setSigner: (signer) => set({ signer }),
}));

interface MetaMaskWalletHook {
  error: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchAccount: () => Promise<void>;
}

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

function useMetaMaskWallet(autoConnect = true): MetaMaskWalletHook {
  const [error, setError] = useState("");
  const setSigner = useSignerStore(state => state.setSigner);

  const connectWallet = useCallback(async () => {
    try {
      setError("");

      if (!(window as any).ethereum) {
        throw new Error("Please install MetaMask to use this feature");
      }

      await (window as any).ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts"
      });

      const chainId = await (window as any).ethereum.request({
        method: "eth_chainId"
      });

      if (chainId !== "0xaa36a7") {
        try {
          await (window as any).ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }]
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            await (window as any).ethereum.request({
              method: "wallet_addEthereumChain",
              params: [baseSepolia]
            });
          } else {
            throw switchError;
          }
        }
      }

      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      
      setSigner(signer); // グローバルステートを更新

    } catch (error: any) {
      setError(error.message);
    }
  }, [setSigner]);

  const switchAccount = useCallback(async () => {
    try {
      setError("");

      if (!(window as any).ethereum) {
        throw new Error("Please install MetaMask to use this feature");
      }

      await (window as any).ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      const accounts = await (window as any).ethereum.request({
        method: "eth_accounts"
      });

      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const signer = provider.getSigner();
      
      setSigner(signer); // グローバルステートを更新

    } catch (error: any) {
      setError(error.message);
    }
  }, [setSigner]);

  const disconnectWallet = useCallback(async () => {
    try {
      setSigner(null); // グローバルステートを更新
    } catch (error: any) {
      setError(error.message);
    }
  }, [setSigner]);

  useEffect(() => {
    if ((window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.on("chainChanged", handleChainChanged);

      if (autoConnect) {
        connectWallet();
      }
      
      return () => {
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
        (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [autoConnect, connectWallet, disconnectWallet]);

  return {
    error,
    connectWallet,
    disconnectWallet,
    switchAccount
  };
}

export default useMetaMaskWallet;