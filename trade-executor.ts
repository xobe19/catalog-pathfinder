import { ethers } from "ethers";
import { CalldataGenerator } from "./calldataGenerator";
import { UNISWAP_V2_ROUTER } from "./constants";
import { provider } from "./rpc_setup";
import { swapExactTokensForTokensArgs } from "./types";

export class TradeExecutor {
  static async swapUniswapV2(
    from_address: string,
    private_key: string,
    { amountIn, amountOutMin, path }: swapExactTokensForTokensArgs
  ) {
    try {
      const txObj = CalldataGenerator.swapTokens(
        amountIn,
        path,
        from_address,
        amountOutMin
      );
      const signer = new ethers.Wallet(private_key).connect(provider);
      const tx = await signer.sendTransaction({
        to: UNISWAP_V2_ROUTER,
        from: from_address,
        data: txObj?.calldata,
      });
      await tx.wait();
      console.log(tx.hash);
    } catch (error) {
      console.log(error);
    }
  }
}
