require("@nomiclabs/hardhat-ethers");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 1337,
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/syTwKAWkTsuLQK8vXIejnL__zek7J5AU",
      },
    },
  },
};
