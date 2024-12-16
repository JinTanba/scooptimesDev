import { clsx, type ClassValue } from "clsx"
import { ethers } from "ethers"
import { twMerge } from "tailwind-merge"
import factoryArtifact from "../EtherFunFactory.json"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c";
let randomRpc = (() => {
  const rpcList = [
    "https://sepolia.infura.io/v3/63b354d57387411191e8c4819970577b",
    "https://sepolia.infura.io/v3/05c6709f3eed48eb89c7e82d7a43c0dc",
    "https://eth-sepolia.g.alchemy.com/v2/k3Dvibh6qSOCk1KkssKyZub9r6AuK1qy",
    "https://eth-sepolia.g.alchemy.com/v2/cidppsnxqV4JafKXVW7qd9N2x6wTvTpN",
    "https://billowing-lively-pallet.ethereum-sepolia.quiknode.pro/152ef6f866d50c44a8ac61547f4e824386390c3e",
    "https://omniscient-autumn-waterfall.ethereum-sepolia.quiknode.pro/13bbe91015b8fd452efdba42d5ef6854682e5941",
    "https://omniscient-autumn-waterfall.ethereum-sepolia.quiknode.pro/13bbe91015b8fd452efdba42d5ef6854682e5941",
    "https://omniscient-autumn-waterfall.ethereum-sepolia.quiknode.pro/13bbe91015b8fd452efdba42d5ef6854682e5941",
    "https://omniscient-autumn-waterfall.ethereum-sepolia.quiknode.pro/13bbe91015b8fd452efdba42d5ef6854682e5941",


  ]
  return rpcList[Math.floor(Math.random() * rpcList.length)]
})
export const provider = new ethers.providers.JsonRpcProvider(randomRpc())
export const ramdomProvider = (() => new ethers.providers.JsonRpcProvider(randomRpc()))
export const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider);
 