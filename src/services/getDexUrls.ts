export const getUniswapUrl = (token0Adddres: string, token1Address: string) => {
  return `https://app.uniswap.org/#/swap?inputCurrency=${token0Adddres.toString()}&outputCurrency=${token1Address}`;
};

export const getSushiSwapUrl = (
  token0Adddres: string,
  token1Address: string
) => {
  return `https://www.sushi.com/swap?chainId=1&token0=${token0Adddres}&token1=${token1Address}`;
};
