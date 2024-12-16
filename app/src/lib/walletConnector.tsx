import { create } from 'zustand';
import { ethers } from 'ethers';
import { useState, useEffect, useCallback } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
import { injectedProvider } from "thirdweb/wallets";
 
const metamaskProvider = injectedProvider("io.metamask");
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

  const checkAndSetupConnection = useCallback(async (providerArg?: any) => {
    const provider = injectedProvider("io.metamask");
    if (!provider || !(provider as any).isMetaMask) {
      return false;
    }

    try {
      const accounts = await (provider as any).request({ method: "eth_accounts" });

      if (accounts.length > 0) {
        const chainId = await (provider as any).request({ method: "eth_chainId" });
        if (chainId !== baseSepolia.chainId) {
          try {
            await (provider as any).request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: baseSepolia.chainId }]
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await (provider as any).request({
                method: "wallet_addEthereumChain",
                params: [baseSepolia]
              });
            } else {
              throw switchError;
            }
          }
        }

        const ethersProvider = new ethers.providers.Web3Provider(provider as any);
        const signer = ethersProvider.getSigner();
        setSigner(signer);
        setIsConnected(true);
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
      setError("");
      console.log('connectWallet')
      const provider = injectedProvider("io.metamask");
      console.log(provider)
      if (!provider || !(provider as any).isMetaMask) {
        throw new Error("MetaMaskをインストールまたは有効化してください");
      }


      const accounts = await (provider as any).request({ method: "eth_requestAccounts" });
      console.log(accounts)
      if (accounts.length === 0) {
        throw new Error("アカウントが取得できませんでした");
      }

      const chainId = await (provider as any).request({ method: "eth_chainId" });
      if (chainId !== baseSepolia.chainId) {
        try {
          await (provider as any).request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: baseSepolia.chainId }]
          });
        } catch (switchError: any) {
          console.log("switchError", switchError)
          if (switchError.code === 4902) {
            await (provider as any).request({
              method: "wallet_addEthereumChain",
              params: [baseSepolia]
            });
          } else {
            throw switchError;
          }
        }
      }

      const ethersProvider = new ethers.providers.Web3Provider(provider as any);
      const signer = ethersProvider.getSigner();
      setSigner(signer);
      setIsConnected(true);
      localStorage.setItem(WALLET_CONNECTED_KEY, 'true');
    } catch (error: any) {
      console.log("error connectWallet", error)
      setError(error.message);
    }
  }, [setSigner]);

  const switchAccount = useCallback(async () => {
    try {
      setError("");

      const provider = await detectEthereumProvider();
      if (!provider || !(provider as any).isMetaMask) {
        throw new Error("MetaMaskをインストールまたは有効化してください");
      }

      // MetaMaskではeth_accountsで再取得することでアカウント変更をトリガー可能
      const accounts = await (provider as any).request({ method: "eth_accounts" });
      if (accounts.length === 0) {
        await connectWallet();
        return;
      }

      const ethersProvider = new ethers.providers.Web3Provider(provider as any);
      const signer = ethersProvider.getSigner();
      setSigner(signer);
      setIsConnected(true);

    } catch (error: any) {
      setError(error.message);
    }
  }, [setSigner, connectWallet]);

  const disconnectWallet = useCallback(async () => {
    try {
      setSigner(null);
      setIsConnected(false);
    } catch (error: any) {
      setError(error.message);
    }
  }, [setSigner]);

  useEffect(() => {
    let currentProvider: any;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        await disconnectWallet();
      } else {
        await checkAndSetupConnection(currentProvider);
      }
    };

    const handleChainChanged = () => {
      // チェーンが変わったらリロード（状態整合を保つため）
      window.location.reload();
    };

    const initializeConnection = async () => {
      console.log('initializeConnection')
      currentProvider = await detectEthereumProvider();
      console.log(currentProvider)
      if (currentProvider && currentProvider.isMetaMask) {
        currentProvider.on("accountsChanged", handleAccountsChanged);
        currentProvider.on("chainChanged", handleChainChanged);

        const shouldConnect = autoConnect || localStorage.getItem(WALLET_CONNECTED_KEY) === 'true';
        if (shouldConnect) {
          const isRestored = await checkAndSetupConnection(currentProvider);
          if (!isRestored && autoConnect) {
            await connectWallet();
          }
        }
      } else {
        // MetaMaskが見つからない場合はエラーをセット
        console.log('MetaMaskが見つからない場合はエラーをセット')
        setError("MetaMaskが検出されませんでした。インストールまたは有効化してください。");
      }
    };

    initializeConnection();

    return () => {
      if (currentProvider) {
        currentProvider.removeListener("accountsChanged", handleAccountsChanged);
        currentProvider.removeListener("chainChanged", handleChainChanged);
      }
    };
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
