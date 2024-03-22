export const getUniswapUrl = (
  token0Adddres: string,
  token1Address: string,
  amountIn: bigint
) => {
  return `https://app.uniswap.org/#/swap?exactAmount=${amountIn}&inputCurrency=${token0Adddres.toString()}&outputCurrency=${token1Address}&use=v2`;
};

export const getSushiSwapUrl = (
  token0Adddres: string,
  token1Address: string,
  amount: bigint
) => {
  return `https://www.sushi.com/swap?chainId=1&token0=${token0Adddres}&token1=${token1Address}&swapAmount=${amount.toString()}`;
};
