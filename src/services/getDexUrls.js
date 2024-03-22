"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSushiSwapUrl = exports.getUniswapUrl = void 0;
const getUniswapUrl = (token0Adddres, token1Address) => {
    return `https://app.uniswap.org/#/swap?inputCurrency=${token0Adddres.toString()}&outputCurrency=${token1Address}`;
};
exports.getUniswapUrl = getUniswapUrl;
const getSushiSwapUrl = (token0Adddres, token1Address) => {
    return `https://www.sushi.com/swap?chainId=1&token0=${token0Adddres}&token1=${token1Address}`;
};
exports.getSushiSwapUrl = getSushiSwapUrl;
