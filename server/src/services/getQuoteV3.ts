import dotenv from "dotenv";
import { CHAIN_ID, UniswapV3Quoter_ADDRESS } from "../constants";
import {
  executeCalls as executeCallsE,
  prepareCall as prepareCallE,
} from "../data-fetcher/ethereumMulticall";
import {
  executeCalls as executeCallsA,
  prepareCall as prepareCallA,
} from "../data-fetcher/arbitrumMulticall";
import { decodeFunction } from "../types";

dotenv.config();

export async function getQuoteV3(
  pending_multicall: {
    fees: number;
    out: string;
    in: string;
    qty: string;
  }[],
  chainId: number
): Promise<bigint[]> {
  const prepareCall =
    chainId == CHAIN_ID.ARBITRUM ? prepareCallA : prepareCallE;
  const executeCalls =
    chainId == CHAIN_ID.ARBITRUM ? executeCallsA : executeCallsE;

  let calls = [];
  for (let pend of pending_multicall) {
    calls.push(
      prepareCall(
        UniswapV3Quoter_ADDRESS,
        "quoteExactInputSingle",
        "function quoteExactInputSingle( address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96 ) public override returns (uint256 amountOut)",
        [pend.in, pend.out, pend.fees, pend.qty, 0]
      )
    );
  }
  const decoder: decodeFunction = (result, call) => {
    if (result.success) return call.decodeResult(result.returnData)[0];
    else return BigInt(0);
  };
  let res = await executeCalls(calls, decoder);

  return res as unknown as bigint[];
  // console.log(JSON.stringify(contract));
}

// (async function () {
//   console.log(
//     await getQuoteV3(
//       [
//         {
//           in: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
//           out: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
//           qty: "1000000000",
//           fees: 3000,
//         },
//       ],
//       CHAIN_ID.ETHEREUM
//     )
//   );
// })();

// (async function () {
//   console.log(
//     await getQuoteV3(
//       "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
//       "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
//       10000,
//       "1000000000"
//     )
//   );
// })();
