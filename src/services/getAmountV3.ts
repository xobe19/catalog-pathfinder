import { FullMath, TickMath } from "@uniswap/v3-sdk";
import JSBI from "jsbi";

enum SwapIndex {
  Token_0_to_Token1,
  Token_1_to_Token0,
}
export function getAmountOutV3(
  inputAmount: number,
  currentTick: number,
  swap: SwapIndex,
  Token0Decimal: number,
  Token1Decimal: number,
  fee: number
): string {
  //  ? Tick => sqrt96
  //  ? ratioX192 = sqrt96 ^ 2
  const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(currentTick);
  const ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96);

  const baseAmount = JSBI.BigInt(inputAmount * 10 ** Token0Decimal);
  const shift = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192));
  let quoteAmount = FullMath.mulDivRoundingUp(ratioX192, baseAmount, shift);

  if (swap === SwapIndex.Token_1_to_Token0) {
    const newQuote =
      (1 / parseInt(quoteAmount.toString())) * 10 ** Token1Decimal;

    return (
      Math.floor(newQuote * 10 ** Token0Decimal) *
      (fee / 100)
    ).toString();
  }
  //   const newQuote = BigInt(quoteAmount.toString()) * BigInt(fee / 100);
  return quoteAmount.toString();
}

const a = getAmountOutV3(
  10000000,
  -384543,
  SwapIndex.Token_0_to_Token1,
  6,
  18,
  3000
);
console.log(a);
