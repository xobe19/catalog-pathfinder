import { FullMath, TickMath } from "@uniswap/v3-sdk";
import JSBI from "jsbi";

function subtractFee(amount: bigint, fees: number) {
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
export function getAmountOutV3(
  baseAmount: string,
  tick: number,
  baseToken: string,
  quoteToken: string,
  fees: number
): bigint {
  const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);

  const baseAmountBigInt = JSBI.BigInt(
    subtractFee(BigInt(baseAmount.toString()), fees).toString()
  );
  let quoteAmount;
  const uint128Max = JSBI.subtract(
    JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)),
    JSBI.BigInt(1)
  );
  if (sqrtRatioX96 <= uint128Max) {
    let ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96);

    let ls = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192));
    if (baseToken < quoteToken) {
      quoteAmount = FullMath.mulDivRoundingUp(ratioX192, baseAmountBigInt, ls);
    } else {
      quoteAmount = FullMath.mulDivRoundingUp(ls, baseAmountBigInt, ratioX192);
    }
  } else {
    let ls = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(64));
    let ratioX128 = FullMath.mulDivRoundingUp(sqrtRatioX96, sqrtRatioX96, ls);

    let ls2 = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(128));

    if (baseToken < quoteToken) {
      quoteAmount = FullMath.mulDivRoundingUp(ratioX128, baseAmountBigInt, ls2);
    } else {
      quoteAmount = FullMath.mulDivRoundingUp(ls2, baseAmountBigInt, ratioX128);
    }
  }

  return BigInt(quoteAmount.toString());
}
