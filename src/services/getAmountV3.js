"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmountOutV3 = void 0;
const v3_sdk_1 = require("@uniswap/v3-sdk");
const jsbi_1 = __importDefault(require("jsbi"));
function subtractFee(amount, fees) {
    /*
    | Fee    | Percent |
    |--------|---------|
    | 100    | 0.01%   |
    | 500    | 0.05%   |
    | 3000   | 0.3%    |
    | 10,000 | 1%      |
    */
    return (amount * BigInt(100) - BigInt(fees)) / BigInt(100);
}
/* TODO: subtract fee from input amt, not output amt */
function getAmountOutV3(baseAmount, tick, baseToken, quoteToken, fees) {
    const sqrtRatioX96 = v3_sdk_1.TickMath.getSqrtRatioAtTick(tick);
    const baseAmountBigInt = jsbi_1.default.BigInt(subtractFee(BigInt(baseAmount.toString()), fees).toString());
    let quoteAmount;
    const uint128Max = jsbi_1.default.subtract(jsbi_1.default.exponentiate(jsbi_1.default.BigInt(2), jsbi_1.default.BigInt(128)), jsbi_1.default.BigInt(1));
    if (sqrtRatioX96 <= uint128Max) {
        let ratioX192 = jsbi_1.default.multiply(sqrtRatioX96, sqrtRatioX96);
        let ls = jsbi_1.default.leftShift(jsbi_1.default.BigInt(1), jsbi_1.default.BigInt(192));
        if (baseToken < quoteToken) {
            quoteAmount = v3_sdk_1.FullMath.mulDivRoundingUp(ratioX192, baseAmountBigInt, ls);
        }
        else {
            quoteAmount = v3_sdk_1.FullMath.mulDivRoundingUp(ls, baseAmountBigInt, ratioX192);
        }
    }
    else {
        let ls = jsbi_1.default.leftShift(jsbi_1.default.BigInt(1), jsbi_1.default.BigInt(64));
        let ratioX128 = v3_sdk_1.FullMath.mulDivRoundingUp(sqrtRatioX96, sqrtRatioX96, ls);
        let ls2 = jsbi_1.default.leftShift(jsbi_1.default.BigInt(1), jsbi_1.default.BigInt(128));
        if (baseToken < quoteToken) {
            quoteAmount = v3_sdk_1.FullMath.mulDivRoundingUp(ratioX128, baseAmountBigInt, ls2);
        }
        else {
            quoteAmount = v3_sdk_1.FullMath.mulDivRoundingUp(ls2, baseAmountBigInt, ratioX128);
        }
    }
    return BigInt(quoteAmount.toString());
}
exports.getAmountOutV3 = getAmountOutV3;
