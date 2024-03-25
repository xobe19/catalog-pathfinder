import { ethers } from "ethers";
import { UniswapQuoter_ABI, UniswapV3Quoter_ADDRESS } from "../constants";
import { Quotercontract, provider } from "../rpc_setup";

import dotenv from "dotenv";
import Bottleneck from "bottleneck";

dotenv.config();

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 40,
});

export async function getQuoteV3(
  inTokenAddress: string,
  outTokenAddress: string,
  fee: number,
  inAmount: string
) {
  // console.log(JSON.stringify(contract));

  try {
    return await limiter.schedule(() =>
      Quotercontract.quoteExactInputSingle.staticCall(
        inTokenAddress,
        outTokenAddress,
        fee,
        inAmount,
        0
      )
    );
  } catch {
    return 0;
  }
}

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
