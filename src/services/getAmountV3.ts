import { FullMath, TickMath } from "@uniswap/v3-sdk";
import JSBI from "jsbi";

function logg(message?: any, ...optionalParams: any[]) {
  // console.log(message, ...optionalParams);
}

export function getAmountOutV3(
  baseAmount: string,
  tick: number,
  baseToken: string,
  quoteToken: string,
  fees: number
): bigint {
  //  ? Tick => sqrt96
  //  ? ratioX192 = sqrt96 ^ 2
  const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);
  logg({ sqrtRatioX96: sqrtRatioX96.toString() });

  const baseAmountBigInt = JSBI.BigInt(baseAmount);
  let quoteAmount;
  const uint128Max = JSBI.subtract(
    JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)),
    JSBI.BigInt(1)
  );
  logg({ uint128Max: uint128Max.toString() });
  if (sqrtRatioX96 <= uint128Max) {
    let ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96);
    logg({ ratioX192: ratioX192.toString() });

    let ls = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192));
    logg(
      "1 1 " +
        FullMath.mulDivRoundingUp(ratioX192, baseAmountBigInt, ls).toString()
    );
    logg(
      "1 2 " +
        FullMath.mulDivRoundingUp(ls, baseAmountBigInt, ratioX192).toString()
    );
    quoteAmount =
      baseToken < quoteToken
        ? FullMath.mulDivRoundingUp(ratioX192, baseAmountBigInt, ls)
        : FullMath.mulDivRoundingUp(ls, baseAmountBigInt, ratioX192);
    logg({ quoteAmount: quoteAmount.toString() });
  } else {
    let ls = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(64));
    let ratioX128 = FullMath.mulDivRoundingUp(sqrtRatioX96, sqrtRatioX96, ls);
    logg({ ratioX128: ratioX128.toString() });

    let ls2 = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(128));
    logg(
      "2 1 " +
        FullMath.mulDivRoundingUp(ratioX128, baseAmountBigInt, ls2).toString()
    );
    logg(
      "2 2 " +
        FullMath.mulDivRoundingUp(ls2, baseAmountBigInt, ratioX128).toString()
    );
    quoteAmount =
      baseToken < quoteToken
        ? FullMath.mulDivRoundingUp(ratioX128, baseAmountBigInt, ls2)
        : FullMath.mulDivRoundingUp(ls2, baseAmountBigInt, ratioX128);
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
