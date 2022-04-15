export type Token = {
  name: string;
  address: string;
  nativeToken: boolean;
};

export type Options = {
  routerAddress: string;
  inputAmount: number;
  targetPrice: number;
  slippage: number;
  bidGasPrice: number;
  minPoolInputTokenAmount: number;
  direction: "buy" | "sell";
};

export type Config = {
  baseToken: Token;
  targetToken: Token;
  options: Options;
  rpcInfo: RpcInfo;
};

export type RpcInfo = {
  rpc: string;
  name: string;
  chainId: number;
};
