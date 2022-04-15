import { initProvider, initWallet } from "./providers";
import _ from "lodash";
import { ethers } from "ethers";
import { initErc20, initFactory, initLP, initRouter02 } from "./contracts";
import { Options, RpcInfo, Token } from "./types";

const { parseUnits, formatUnits } = ethers.utils;

export const recursivelyCheckPool = async (
  provider: ethers.providers.JsonRpcProvider,
  signer: ethers.Wallet,
  router: ethers.Contract,
  options: Options,
  baseToken: ethers.Contract,
  targetToken: ethers.Contract,
  weth: ethers.Contract,
  factory: ethers.Contract,
  initLP: Function,
  lp: ethers.Contract | undefined = undefined
) => {
  const recursiveCall = async (lp: ethers.Contract | undefined = undefined) => {
    return await recursivelyCheckPool(
      provider,
      signer,
      router,
      options,
      baseToken,
      targetToken,
      weth,
      factory,
      initLP,
      lp
    );
  };

  // detect block event
  provider.once("block", async () => {
    console.log("=========== recursivelyCheckPool ===========");
    // calculate the token address
    let pairAddress;
    if (!lp) {
      pairAddress = await factory.getPair(
        baseToken.address,
        targetToken.address
      );
      const pairCode = await provider.getCode(pairAddress);
      // if pool not exist, back
      if (pairCode === "0x") {
        console.log("Does not detect the lp token deployed");
        return await recursiveCall();
      }
    } else {
      pairAddress = lp.address;
    }

    console.log(`the lp exists, lp address is ${pairAddress}`);

    const baseDecimals = await baseToken.decimals();
    const targetDecimals = await targetToken.decimals();

    const pairToken = lp ?? initLP(signer, pairAddress);

    // compare the pool amount is over minPoolAmount
    const token0 = await pairToken.token0();
    const [reserve0, reserve1] = await pairToken.getReserves();

    const poolAmount = token0 === baseToken.address ? reserve0 : reserve1;
    if (
      poolAmount.lt(
        parseUnits("" + options.minPoolInputTokenAmount, baseDecimals)
      )
    ) {
      console.log(`The liquidity is not enough!`);
      return await recursiveCall(pairToken);
    }

    // check the price
    const path =
      options.direction === "buy"
        ? [baseToken.address, targetToken.address]
        : [targetToken.address, baseToken.address];
    const inputDecimals =
      options.direction === "buy" ? baseDecimals : targetDecimals;
    const outputDecimals =
      options.direction === "buy" ? targetDecimals : baseDecimals;

    const inputAmount = parseUnits("" + options.inputAmount, inputDecimals);
    const [, estimateAmount] = await router.getAmountsOut(inputAmount, path);
    const estimateAmountNum = formatUnits(estimateAmount, outputDecimals);
    console.log(`estimated amount out: ${estimateAmountNum}`);
    const actualPrice =
      options.direction === "buy"
        ? options.inputAmount / +estimateAmountNum
        : +estimateAmountNum / options.inputAmount;

    console.log(`Price right now: ${actualPrice}`);
    if (options.direction === "buy") {
      if (actualPrice > options.targetPrice) {
        console.log(`The price is too high to buy!`);
        return await recursiveCall(pairToken);
      }
    } else {
      if (actualPrice < options.targetPrice) {
        console.log(`The price is too low to sell!`);
        return await recursiveCall(pairToken);
      }
    }

    // sell/buy, make sure it is approved to router first!
    const amountOutMin = estimateAmount
      .mul(Math.round((1 - options.slippage) * 10000))
      .div(10000);
    console.log(
      `minumum token output: ${formatUnits(amountOutMin, outputDecimals)}`
    );
    const processTransaction = () => {
      const getDeadline = () => {
        const time = new Date().getTime();
        return Math.round(time / 1000 + 20 * 60);
      };
      if (path[0] === weth.address) {
        return router.swapExactETHForTokens(
          amountOutMin,
          path,
          signer.address,
          getDeadline(),
          {
            value: inputAmount,
            gasPrice: parseUnits("" + options.bidGasPrice, "gwei"),
          }
        );
      } else if (path[1] === weth.address) {
        return router.swapExactTokensForETH(
          inputAmount,
          amountOutMin,
          path,
          signer.address,
          getDeadline(),
          { gasPrice: parseUnits("" + options.bidGasPrice, "gwei") }
        );
      } else {
        return router.swapExactTokensForTokens(
          inputAmount,
          amountOutMin,
          path,
          signer.address,
          getDeadline(),
          { gasPrice: parseUnits("" + options.bidGasPrice, "gwei") }
        );
      }
    };

    const tx = await processTransaction();
    await tx.wait();
    console.log(`transaction success! tx: ${tx.hash}`);
  });
};

export const run = async (
  baseToken: Token,
  targetToken: Token,
  options: Options,
  rpcInfo: RpcInfo,
  privateKey: string
) => {
  // init provider
  const provider = initProvider(rpcInfo);

  // init wallet
  const signer = initWallet(provider, privateKey);

  // init contracts
  const router = initRouter02(signer, options.routerAddress);
  const wethAddress = await router.WETH();
  const factoryAddress = await router.factory();
  const weth = initErc20(signer, wethAddress);
  const factory = initFactory(signer, factoryAddress);

  const finalBaseToken = baseToken.nativeToken
    ? weth
    : initErc20(signer, baseToken.address);
  const finalTargetToken = targetToken.nativeToken
    ? weth
    : initErc20(signer, targetToken.address);

  // call recursive check
  await recursivelyCheckPool(
    provider,
    signer,
    router,
    options,
    finalBaseToken,
    finalTargetToken,
    weth,
    factory,
    initLP
  );
};
