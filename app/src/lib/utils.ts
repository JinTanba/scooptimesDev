import { clsx, type ClassValue } from "clsx"
import { ethers } from "ethers"
import { twMerge } from "tailwind-merge"
import factoryArtifact from "../EtherFunFactory.json"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const factoryAddress = "0x49f69e0C299cB89c733a73667F4cdE4d461E5d6c";
export const provider = new ethers.providers.JsonRpcProvider("https://sepolia.infura.io/v3/63b354d57387411191e8c4819970577b")
export const factory = new ethers.Contract(factoryAddress, factoryArtifact.abi, provider);
 