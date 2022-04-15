const hre = require("hardhat");
const {
  ERC20_ABI,
  ROUTER02_ABI,
  FACTORY_ABI,
  LP_ABI,
} = require("../dist/contracts");
const { recursivelyCheckPool } = require("../dist/run");

const ethers = hre.ethers;
const { parseUnits } = ethers.utils;

async function mineNBlocks(n) {
  for (let index = 0; index < n; index++) {
    await sleep(5000);
    await ethers.provider.send("evm_mine");
  }
}

const mockRun = async ({
  signer,
  options,
  router,
  baseToken,
  targetToken,
  weth,
  factory,
  initLP,
}) => {
  // call recursive check
  await recursivelyCheckPool(
    ethers.provider,
    signer,
    router,
    options,
    baseToken,
    targetToken,
    weth,
    factory,
    initLP
  );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getDeadline = () => {
  const now = Math.round(new Date().getTime() / 1000);
  return now + 20 * 60;
};

const mockPutLiquidity = async ({ signer, xyz, router }) => {
  await sleep(2000);

  await xyz.approve(
    router.address,
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
  );

  console.log("~~~~~~~ put liquidity for the first time ~~~~~~~");
  await router.addLiquidityETH(
    xyz.address,
    await parseUnits("42000", 18),
    await parseUnits("42000", 18),
    parseUnits("10", 18),
    signer.address,
    getDeadline(),
    { value: parseUnits("10", 18) }
  );

  await sleep(2000);

  console.log("~~~~~~~ put liquidity for the second time ~~~~~~~");
  await router.addLiquidityETH(
    xyz.address,
    await parseUnits("4158000", 18),
    await parseUnits("4158000", 18),
    parseUnits("990", 18),
    signer.address,
    getDeadline(),
    { value: parseUnits("990", 18) }
  );
  console.log("~~~~~~~~~ successfully put liqudity ~~~~~~~~~");
};

const main = async () => {
  const options = {
    inputAmount: 5000,
    targetPrice: 0.00042,
    slippage: 0.08,
    routerAddress: "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a",
    bidGasPrice: 1000,
    minPoolInputTokenAmount: 200,
    direction: "buy",
  };
  const [signer] = await ethers.getSigners();

  // deploy the mocktoken first
  const MockToken = await ethers.getContractFactory("MockToken");
  const xyz = await MockToken.deploy(
    "XYZ",
    "XYZ",
    signer.address,
    parseUnits("4205000")
  );
  console.log(`the address of mock: ${xyz.address}`);

  const initContract = (abi) => (provider, address) => {
    return new ethers.Contract(address, abi, provider);
  };
  const initErc20 = initContract(ERC20_ABI);
  const initRouter02 = initContract(ROUTER02_ABI);
  const initFactory = initContract(FACTORY_ABI);
  const initLP = initContract(LP_ABI);

  // init contracts
  const router = initRouter02(signer, options.routerAddress);
  const wethAddress = await router.WETH();
  const factoryAddress = await router.factory();
  const weth = initErc20(signer, wethAddress);
  const factory = initFactory(signer, factoryAddress);

  const finalBaseToken = weth;
  const finalTargetToken = xyz;

  const mockPutLiquidityPromise = mockPutLiquidity({
    signer,
    router,
    xyz,
  });

  const mineNBlocksPromise = mineNBlocks(750);

  // mockrun on config asynchronously, need to override the token settings
  const mockRunPromise = mockRun({
    signer,
    options,
    router,
    baseToken: finalBaseToken,
    targetToken: finalTargetToken,
    weth,
    factory,
    initLP,
  });

  await Promise.all([
    mockPutLiquidityPromise,
    mineNBlocksPromise,
    mockRunPromise,
  ]);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
