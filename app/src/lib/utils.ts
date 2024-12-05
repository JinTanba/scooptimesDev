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
    "https://eth-sepolia.g.alchemy.com/v2/cidppsnxqV4JafKXVW7qd9N2x6wTvTpN"
  ]
  return rpcList[Math.floor(Math.random() * rpcList.length)]
})
export const provider = new ethers.providers.JsonRpcProvider(randomRpc())
export const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider);
 