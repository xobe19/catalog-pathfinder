import { Contract, parseUnits } from "ethers";
import { swapABI } from "./abis";
import { UNISWAP_V2_ROUTER } from "./constants";
import { provider } from "./rpc_setup";
import { swapExactTokensForTokensArgs } from "./types";

async function generateCallData(
  amountIn: swapExactTokensForTokensArgs["amountIn"],
  path: swapExactTokensForTokensArgs["path"],
  decimalOfTokenA: number,
  walletAddress: string,
  amountOutMin?: swapExactTokensForTokensArgs["amountOutMin"]
) {
  try {
    const contractInstance = new Contract(UNISWAP_V2_ROUTER, swapABI, provider);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    // ? 10 mins after this

    const txObj: swapExactTokensForTokensArgs = {
      amountIn: parseUnits(amountIn.toString(), decimalOfTokenA),
      amountOutMin: amountOutMin ? amountOutMin : 0,
      path: path,
      deadline: deadline,
      to: walletAddress,
    };

    const calldata = contractInstance.interface.encodeFunctionData(
      "swapExactTokensForTokens",
      [txObj.amountIn, txObj.amountOutMin, txObj.path, txObj.to, txObj.deadline]
    );
    console.log(calldata);
  } catch (error) {
    console.log(error);
  }
}

const path = [
  "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  "0xd46ba6d942050d489dbd938a2c909a5d5039a161",
  "0xd233d1f6fd11640081abb8db125f722b5dc729dc",
  "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
  "0x6b175474e89094c44da98b954eedeac495271d0f",
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
];

generateCallData(
  BigInt(100000000000000000000000000),
  path,
  18,
  "0x5f0923323FA1b99f38Ed07254d94F15D7803D4a6"
);
