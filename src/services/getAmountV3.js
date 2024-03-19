"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmountOutV3 = void 0;
const v3_sdk_1 = require("@uniswap/v3-sdk");
const jsbi_1 = __importDefault(require("jsbi"));
function logg(message, ...optionalParams) {
    // console.log(message, ...optionalParams);
}
function getAmountOutV3(baseAmount, tick, baseToken, quoteToken, fees) {
    //  ? Tick => sqrt96
    //  ? ratioX192 = sqrt96 ^ 2
    const sqrtRatioX96 = v3_sdk_1.TickMath.getSqrtRatioAtTick(tick);
    logg({ sqrtRatioX96: sqrtRatioX96.toString() });
    const baseAmountBigInt = jsbi_1.default.BigInt(baseAmount);
    let quoteAmount;
    const uint128Max = jsbi_1.default.subtract(jsbi_1.default.exponentiate(jsbi_1.default.BigInt(2), jsbi_1.default.BigInt(128)), jsbi_1.default.BigInt(1));
    logg({ uint128Max: uint128Max.toString() });
    if (sqrtRatioX96 <= uint128Max) {
        let ratioX192 = jsbi_1.default.multiply(sqrtRatioX96, sqrtRatioX96);
        logg({ ratioX192: ratioX192.toString() });
        let ls = jsbi_1.default.leftShift(jsbi_1.default.BigInt(1), jsbi_1.default.BigInt(192));
        logg("1 1 " +
            v3_sdk_1.FullMath.mulDivRoundingUp(ratioX192, baseAmountBigInt, ls).toString());
        logg("1 2 " +
            v3_sdk_1.FullMath.mulDivRoundingUp(ls, baseAmountBigInt, ratioX192).toString());
        quoteAmount =
            baseToken < quoteToken
                ? v3_sdk_1.FullMath.mulDivRoundingUp(ratioX192, baseAmountBigInt, ls)
                : v3_sdk_1.FullMath.mulDivRoundingUp(ls, baseAmountBigInt, ratioX192);
        logg({ quoteAmount: quoteAmount.toString() });
    }
    else {
        let ls = jsbi_1.default.leftShift(jsbi_1.default.BigInt(1), jsbi_1.default.BigInt(64));
        let ratioX128 = v3_sdk_1.FullMath.mulDivRoundingUp(sqrtRatioX96, sqrtRatioX96, ls);
        logg({ ratioX128: ratioX128.toString() });
        let ls2 = jsbi_1.default.leftShift(jsbi_1.default.BigInt(1), jsbi_1.default.BigInt(128));
        logg("2 1 " +
            v3_sdk_1.FullMath.mulDivRoundingUp(ratioX128, baseAmountBigInt, ls2).toString());
        logg("2 2 " +
            v3_sdk_1.FullMath.mulDivRoundingUp(ls2, baseAmountBigInt, ratioX128).toString());
        quoteAmount =
            baseToken < quoteToken
                ? v3_sdk_1.FullMath.mulDivRoundingUp(ratioX128, baseAmountBigInt, ls2)
                : v3_sdk_1.FullMath.mulDivRoundingUp(ls2, baseAmountBigInt, ratioX128);
        logg({ quoteAmount: quoteAmount.toString() });
    }
    logg({
        tick,
        baseAmount,
        baseToken,
        quoteToken,
        outAmount: quoteAmount.toString(),
        fees,
    });
    // 0.05%, 0.3%, and 1.00%
    /*
    | Fee    | Percent |
    |--------|---------|
    | 100    | 0.01%   |
    | 500    | 0.05%   |
    | 3000   | 0.3%    |
    | 10,000 | 1%      |
    */
    const quoteAmountBigInt = BigInt(quoteAmount.toString());
    return (quoteAmountBigInt * BigInt(100) - BigInt(fees)) / BigInt(100);
}
exports.getAmountOutV3 = getAmountOutV3;
// const a = getAmountOutV3(
//   "500_000_000000000_000000000".replace(/_/g, ""),
//   -384543,
//   "a",
//   "b"
// );
// logg(a);
const weth = {
    address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    decimals: 18,
};
const usdc = {
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    decimals: 6,
};
const wbtc = {
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    decimals: 8,
};
const tick = 194364;
// const wethToUsdc = getAmountOutV3(
//   Mathjs.bignumber(100).mul(Mathjs.bignumber(10).pow(weth.decimals)).toString(),
//   tick,
//   weth.address,
//   usdc.address,
//   3000
// );
// console.log(wethToUsdc);
// logg(
//   getAmountOutV3(wethToUsdc.toString(), 65300, usdc.address, wbtc.address)
// );
