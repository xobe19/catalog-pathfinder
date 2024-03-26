import { ethers } from "ethers";
import { UniswapQuoter_ABI, UniswapV3Quoter_ADDRESS } from "../constants";
import { Quotercontract, provider } from "../rpc_setup";

import dotenv from "dotenv";
import { ModifiedPairV3, decodeFunction } from "../types";
import {
  executeCalls,
  multicall,
  prepareCall,
} from "../data-fetcher/multicall";

dotenv.config();

export async function getQuoteV3(
  pending_multicall: {
    fees: number;
    out: string;
    in: string;
    qty: string;
  }[]
): Promise<bigint[]> {
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

(async function () {
  console.log(
    await getQuoteV3([
      {
        in: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        out: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
        qty: "1000000000",
        fees: 3000,
      },
    ])
  );
})();

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
