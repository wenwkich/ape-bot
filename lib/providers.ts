import { ethers } from "ethers";
import { RpcInfo } from "./types";

export const initProvider = (rpcConfig: RpcInfo) => {
  const { rpc, name, chainId } = rpcConfig;
  return new ethers.providers.JsonRpcProvider(rpc, {
    name,
    chainId,
  });
};

export const initWallet = (
  provider: ethers.providers.JsonRpcProvider,
  privateKey: string
) => {
  const walletWithoutProvider = new ethers.Wallet(privateKey);
  return walletWithoutProvider.connect(provider);
};
