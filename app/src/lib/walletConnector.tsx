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
  isConnected: boolean;
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

const WALLET_CONNECTED_KEY = 'isWalletConnected';

function useMetaMaskWallet(autoConnect = true): MetaMaskWalletHook {
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const setSigner = useSignerStore(state => state.setSigner);

  const checkAndSetupConnection = useCallback(async () => {
    if (!(window as any).ethereum) return;

    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_accounts"
      });

      if (accounts.length > 0) {
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
        setSigner(signer);
        setIsConnected(true);
        localStorage.setItem(WALLET_CONNECTED_KEY, 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to restore connection:", error);
      return false;
    }
  }, [setSigner]);

  const connectWallet = useCallback(async () => {
    try {
      console.log("👉connectWallet");
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

      console.log("👉chainId", chainId);

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
      console.log("👉signer", signer);
      setSigner(signer);
      setIsConnected(true);
      localStorage.setItem(WALLET_CONNECTED_KEY, 'true');

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
      
      setSigner(signer);
      setIsConnected(true);
      localStorage.setItem(WALLET_CONNECTED_KEY, 'true');

    } catch (error: any) {
      setError(error.message);
    }
  }, [setSigner]);

  const disconnectWallet = useCallback(async () => {
    try {
      setSigner(null);
      setIsConnected(false);
      localStorage.removeItem(WALLET_CONNECTED_KEY);
    } catch (error: any) {
      setError(error.message);
    }
  }, [setSigner]);

  useEffect(() => {
    if ((window as any).ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          await disconnectWallet();
        } else {
          await checkAndSetupConnection();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      (window as any).ethereum.on("chainChanged", handleChainChanged);

      // 初期化時の接続状態の復元
      const initializeConnection = async () => {
        const shouldConnect = autoConnect || localStorage.getItem(WALLET_CONNECTED_KEY) === 'true';
        if (shouldConnect) {
          const isRestored = await checkAndSetupConnection();
          if (!isRestored && autoConnect) {
            await connectWallet();
          }
        }
      };

      initializeConnection();
      
      return () => {
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
        (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [autoConnect, connectWallet, disconnectWallet, checkAndSetupConnection]);

  return {
    error,
    isConnected,
    connectWallet,
    disconnectWallet,
    switchAccount
  };
}

export default useMetaMaskWallet;