import * as Mathjs from "mathjs";

/* Reference from https://github.com/Jeiwan/uniswapv3-code/blob/2aebeebe70e6b42aa04a631101f0e2e1f3d7e8a8/unimath.py */

const q96 = "79228162514264337593543950336";

function calcAmount0(
  liq: Mathjs.BigNumber,
  pa: Mathjs.BigNumber,
  pb: Mathjs.BigNumber
) {
  if (pa.greaterThan(pb)) {
    const temp = pa;
    pa = pb;
    pb = temp;
  }

  return liq.mul(q96).mul(pb.sub(pa)).div(pb).div(pa).floor();
}

function calcAmount1(
  liq: Mathjs.BigNumber,
  pa: Mathjs.BigNumber,
  pb: Mathjs.BigNumber
) {
  if (pa.greaterThan(pb)) {
    const temp = pa;
    pa = pb;
    pb = temp;
  }

  return liq.mul(pb.sub(pa)).div(q96).floor();
}

interface Pool {
  address: string;
  liquidity: Mathjs.BigNumber;
  sqrtPriceX96: Mathjs.BigNumber;
  fees: number;
  token0Address: string;
  token0Decimals: number;
  token0Symbol: string;
  token1Address: string;
  token1Decimals: number;
  token1Symbol: string;
}

function getAmountOut(
  pool: Pool,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: Mathjs.BigNumber
) {
  const liq = pool.liquidity;
  const sqrtpCur = pool.sqrtPriceX96;
  const token0Address = pool.token0Address;
  const token1Address = pool.token1Address;

  if (tokenInAddress === token0Address) {
    // In: token0, Out: token1
    const decimalsIn = pool.token0Decimals;
    const decimalsOut = pool.token1Decimals;
    // amount_in *= 10**decimals_in
    amountIn = amountIn.mul(Mathjs.bignumber(10).pow(decimalsIn));
    // price_next = int((liq * q96 * sqrtp_cur) // (liq * q96 + amount_in * sqrtp_cur))
    const priceNext = liq
      .mul(q96)
      .mul(sqrtpCur)
      .divToInt(liq.mul(q96).add(amountIn.mul(sqrtpCur)))
      .floor();
    // amount_in = calc_amount0(liq, price_next, sqrtp_cur)
    amountIn = calcAmount0(liq, priceNext, sqrtpCur);
    // amount_out = calc_amount1(liq, price_next, sqrtp_cur)
    const amountOut = calcAmount1(liq, priceNext, sqrtpCur);
    // return amount_out / (10**decimals_out)
    return amountOut.div(Mathjs.bignumber(10).pow(decimalsOut));
  } else if (tokenInAddress === token1Address) {
    // In: token1, Out: token0
    const decimalsIn = pool.token1Decimals;
    const decimalsOut = pool.token0Decimals;
    // amount_in *= 10**decimals_in
    amountIn = amountIn.mul(Mathjs.bignumber(10).pow(decimalsIn));
    // price_diff = (amount_in * q96) // liq
    const priceDiff = amountIn.mul(q96).divToInt(liq);
    // price_next = sqrtp_cur + price_diff
    const priceNext = sqrtpCur.add(priceDiff);
    // amount_in = calc_amount1(liq, price_next, sqrtp_cur)
    amountIn = calcAmount1(liq, priceNext, sqrtpCur);
    // amount_out = calc_amount0(liq, price_next, sqrtp_cur)
    const amountOut = calcAmount0(liq, priceNext, sqrtpCur);
    // return amount_out / (10**decimals_out)
    return amountOut.div(Mathjs.bignumber(10).pow(decimalsOut));
  }
}

const pool: Pool = {
  address: "",
  fees: 3000,
  token0Symbol: "USDC",
  token0Address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  token0Decimals: 6,
  token1Symbol: "WETH",
  token1Address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  token1Decimals: 18,
  liquidity: Mathjs.bignumber("2205844668376370500"),
  sqrtPriceX96: Mathjs.bignumber("1287904652766006809775726356449899"),
};

console.log(
  getAmountOut(
    pool,
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" /* WETH */,
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" /* USDC */,
    Mathjs.bignumber(1039)
  )
);

console.log(
  getAmountOut(
    pool,
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" /* USDC */,
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" /* WETH */,
    Mathjs.bignumber(3912820)
  )
);
