# Limit Bot

a limit bot to buy tokens from uniswap v2 pools

parameters:

- input token name, address, decimals
- output token name, address, decimals
- swap amount
- target price (output token / input token)
- slippage basis point (calculate in percentage)

features:

- once the pool has the liquidity, ape
- once the price is less than target price, ape
  - if the price is already larger, then don't ape
- set up a slippage to ensure the success
