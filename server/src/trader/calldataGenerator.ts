import { Contract } from "ethers";
import { provider } from "../rpc_setup";
import { UNISWAP_V2_ROUTER, swapperContractAddress } from "../constants";
import {
  UNISWAP_SWAP_ABI,
  approveERC20Abi,
  swapABI,
} from "../data-fetcher/abis";
import {
  CallDataV3MultiSwap,
  swapExactTokensForTokensArgs,
  transactionObj,
} from "../types";
import { encodeRouteToPath } from "@uniswap/v3-sdk";

export class CalldataGenerator {
  /**
   * @param amountIn - Amount of input tokens to send.
   * @param path - List of token address
   * @param walletAddress - sender address
   * @param amountOutMin -  Minimum amount of output tokens that must be received for the transaction not to revert.
   * @returns call data for transaction
   */

  static swapTokens(
    amountIn: swapExactTokensForTokensArgs["amountIn"],
    path: swapExactTokensForTokensArgs["path"],
    walletAddress: string,
    amountOutMin?: swapExactTokensForTokensArgs["amountOutMin"]
  ) {
    try {
      const contractInstance = new Contract(
        UNISWAP_V2_ROUTER,
        swapABI,
        provider
      );
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      const txInfo: swapExactTokensForTokensArgs = {
        amountIn: amountIn,
        amountOutMin: amountOutMin ? amountOutMin : 0,
        path: path,
        to: walletAddress,
        deadline: deadline,
      };

      const calldata = contractInstance.interface.encodeFunctionData(
        "swapExactTokensForTokens",
        [
          txInfo.amountIn,
          txInfo.amountOutMin,
          txInfo.path,
          txInfo.to,
          txInfo.deadline,
        ]
      );
      const txObj: transactionObj = {
        to: UNISWAP_V2_ROUTER,
        data: calldata,
        from: walletAddress,
      };
      return { calldata: calldata, txObj: txObj };
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Approves spending of ERC20 tokens by a spender address.
   *
   * @param ERC20_TOKEN - The address of the ERC20 token.
   * @param spender_address - The address of the spender.
   * @param amount - The amount of tokens to approve for spending.
   * @param from_address -  `msg.sender`
   * @returns The call data for the transaction.
   */
  static approveTokens(
    ERC20_TOKEN: string,
    spender_address: string,
    amount: bigint,
    from_address: string
  ) {
    try {
      const contractInstance = new Contract(
        ERC20_TOKEN,
        approveERC20Abi,
        provider
      );
      const calldata = contractInstance.interface.encodeFunctionData(
        "approve",
        [spender_address, amount]
      );
      const txObj: transactionObj = {
        to: ERC20_TOKEN,
        data: calldata,
        from: from_address,
      };
      return { calldata: calldata, txObj: txObj };
    } catch (error) {
      console.log(error);
    }
  }

  static encodePathV3(path: string[], fees: number[]): string {
    if (path.length != fees.length + 1) {
      throw new Error("path/fee lengths do not match");
    }
    const FEE_SIZE = 3;
    let encoded = "0x";
    for (let i = 0; i < fees.length; i++) {
      encoded += path[i].slice(2);
      // ! 3 byte encoding of the fee
      encoded += fees[i].toString(16).padStart(2 * FEE_SIZE, "0");
    }
    encoded += path[path.length - 1].slice(2);
    return encoded.toLowerCase();
  }

  // path: abi.encodePacked(DAI, poolFee, USDC, poolFee, WETH9),
  // recipient: msg.sender,
  // deadline: block.timestamp,
  // amountIn: amountIn,
  // amountOutMinimum: 0
  static generateV3(
    path: string[],
    fees: number[],
    walletAddress: string,
    amountIn: string,
    amountOutMinimum?: number
  ) {
    const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
    const params: CallDataV3MultiSwap = {
      path: this.encodePathV3(path, fees),
      recipient: walletAddress,
      deadline: deadline,
      amountIn: amountIn,
      amountOutMinimum: amountOutMinimum ? amountOutMinimum : 0,
    };

    const ContractInstance = new Contract(
      swapperContractAddress,
      UNISWAP_SWAP_ABI,
      provider
    );

    const callData = ContractInstance.interface.encodeFunctionData(
      "exactInput",
      [params]
    );
    return callData;
  }
}
