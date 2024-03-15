import { FullMath, TickMath } from "@uniswap/v3-sdk";
import JSBI from "jsbi";

enum SwapIndex {
  Token_0_to_Token1,
  Token_1_to_Token0,
}
export function getAmountOutV3(
  inputAmount: string,
  currentTick: number,
  inputAddr: string,
  outAddr: string
): string {
  //  ? Tick => sqrt96
  //  ? ratioX192 = sqrt96 ^ 2
  const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(currentTick);

  const baseAmount = JSBI.BigInt(inputAmount);
  let quoteAmount;
  let ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96);
  let ls = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192));

  const val = FullMath.mulDivRoundingUp(ratioX192, baseAmount, ls);
  console.log(val.toString() + "sd");
  if (sqrtRatioX96 < JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128))) {
    let ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96);
    let ls = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192));
    quoteAmount =
      inputAddr < outAddr
        ? FullMath.mulDivRoundingUp(ratioX192, baseAmount, ls)
        : FullMath.mulDivRoundingUp(ls, baseAmount, ratioX192);
  } else {
    let ls = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(64));
    let ratioX128 = FullMath.mulDivRoundingUp(sqrtRatioX96, sqrtRatioX96, ls);

    let ls2 = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(128));

    quoteAmount =
      inputAddr < outAddr
        ? FullMath.mulDivRoundingUp(ratioX128, baseAmount, ls2)
        : FullMath.mulDivRoundingUp(ls2, baseAmount, ratioX128);
  }
  return quoteAmount.toString();
}

const a = getAmountOutV3(
  "500_000_000000000_000000000".replace(/_/g, ""),

  -384543,
  "a",
  "b"
);
console.log(a);
