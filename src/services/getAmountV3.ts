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

  console.log("340282366920938463463374607431768211455");
  const uint128Max = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128));
  console.log(uint128Max.toString());
  if (sqrtRatioX96 < uint128Max) {
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

// const a = getAmountOutV3(
//   "500_000_000000000_000000000".replace(/_/g, ""),

//   -384543,
//   "a",
//   "b"
// );
// console.log(a);

function main(
  tick: number,
  token0: string,
  token1: string,
  amountIn: string,
  decimal0: number
) {
  const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);
  const ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96);
  const shift = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192));
  let quoteAmount;
  const ff = 10 ** 6;
  const baseAmount = JSBI.multiply(
    JSBI.BigInt(amountIn.toString()),
    JSBI.BigInt(ff)
  );
  if (token0 < token1) {
    quoteAmount = FullMath.mulDivRoundingUp(ratioX192, baseAmount, shift);
  } else {
    quoteAmount = FullMath.mulDivRoundingUp(shift, baseAmount, ratioX192);
  }
  console.log(quoteAmount.toString());
  return quoteAmount;
}

main(
  -89170,
  "0x5eed99d066a8caf10f3e4327c1b3d8b673485eed",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "10000",
  18
);
// ""	"4490748073519104952969"	"917689661928664980627449623"	3000	""	18	"SEED"	""	18	"WETH"	-89170
