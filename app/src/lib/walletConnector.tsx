// lib/walletConnector.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

interface MetaMaskWalletHook {
  account: string;
  chainId: string;
  signer: ethers.Signer | null;
  isConnecting: boolean;
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

function useMetaMaskWallet(autoConnect = false): MetaMaskWalletHook {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState("");
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError("");

      if (!window.ethereum) {
        throw new Error("Please install MetaMask to use this feature");
      }

      // wallet_requestPermissionsを使用してアカウント選択モーダルを表示
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      // 選択されたアカウントを取得
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      const chainId = await window.ethereum.request({
        method: "eth_chainId"
      });

      if (chainId !== "0xaa36a7") {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }]
          });
        } catch (switchError: any) {
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
      setSigner(signer);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // アカウント切り替え用の関数を追加
  const switchAccount = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError("");

      if (!window.ethereum) {
        throw new Error("Please install MetaMask to use this feature");
      }

      // アカウント選択モーダルを表示
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });

      // 選択されたアカウントを取得
      const accounts = await window.ethereum.request({
        method: "eth_accounts"
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      setAccount(accounts[0]);
      setSigner(signer);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      setAccount("");
      setChainId("");
      setSigner(null);
    } catch (error: any) {
      setError(error.message);
    }
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      if (autoConnect) {
        connectWallet();
      }
      
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [autoConnect, connectWallet, disconnectWallet]);

  return {
    account,
    chainId,
    signer,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchAccount
  };
}

export default useMetaMaskWallet;