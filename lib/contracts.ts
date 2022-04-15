import { ethers } from "ethers";
import Router02 from "./Router02.json";

export const ERC20_ABI = ["function decimals() view returns (uint8)"];

export const ROUTER02_ABI = Router02;

export const LP_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
];

export const FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) external view returns (address pair)",
];

export const initContract =
  (abi: ethers.ContractInterface) =>
  (provider: ethers.Signer | ethers.providers.Provider, address: string) => {
    return new ethers.Contract(address, abi, provider);
  };

export const initErc20 = initContract(ERC20_ABI);
export const initRouter02 = initContract(ROUTER02_ABI);
export const initLP = initContract(LP_ABI);
export const initFactory = initContract(FACTORY_ABI);
