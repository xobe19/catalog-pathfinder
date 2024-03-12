import axios from "axios";
import * as dotenv from "dotenv";
import { UNISWAP_V2_ROUTER } from "../constants";
import { tenderlyTxObj } from "../types";
import { CalldataGenerator } from "./calldataGenerator";

dotenv.config();
const TENDERLY_ACCESS_KEY = process.env.TENDERLY_API;

export class Simulator {
  static executeBatch = async (
    transactions: tenderlyTxObj[],
    path: string[],
    block_number?: number
  ) => {
    try {
      const res = (
        await axios.post(
          `https://api.tenderly.co/api/v1/account/hiteshlwni/project/project/simulate-bundle`,
          {
            simulations: transactions.map((singleTx) => ({
              network_id: "1",
              save: true,
              save_if_fails: true,
              simulation_type: "full",
              block_number: block_number,
              ...singleTx,
            })),
          },
          {
            headers: {
              "X-Access-Key": TENDERLY_ACCESS_KEY as string,
            },
          }
        )
      ).data;

      let stack_trace =
        res.simulation_results[1].transaction.transaction_info.stack_trace;

      let failedAt = "";

      for (let stkEle of stack_trace) {
        if (path.find((e) => e === stkEle.contract)) {
          failedAt = stkEle.contract;
          break;
        }
      }

      return {
        success: res.simulation_results[1].simulation.status,
        failedAt,
      };

      console.timeEnd("Batch Simulation");
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  // ? approve amountIn token to UniswapV2Router from from_address && swapTokens
  static swapUniswapV2 = async (
    from_address: string,
    amountIn: bigint,
    path: string[],
    amountOutMin: number
  ) => {
    // ? MKR -> WTBC
    const transactionData = CalldataGenerator.approveTokens(
      path[0],
      UNISWAP_V2_ROUTER,
      amountIn,
      from_address
    );

    const swapCall = CalldataGenerator.swapTokens(
      amountIn,
      path,
      from_address,
      amountOutMin
    );

    const calls: tenderlyTxObj[] = [
      {
        from: transactionData?.txObj.from!,
        to: transactionData?.txObj.to!,
        input: transactionData?.calldata!,
      },
      {
        from: swapCall?.txObj.from!,
        to: swapCall?.txObj.to!,
        input: swapCall?.calldata!,
      },
    ];

    return await this.executeBatch(calls, path);
  };

  static test = async () => {
    // ? MKR -> WTBC
    const whale = "0xe2b03ed9a9213fe82413ca9338856433acc5a853";
    const amount = BigInt(4000000000000000000);
    const mkr = "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2";
    const transactionData = CalldataGenerator.approveTokens(
      mkr,
      UNISWAP_V2_ROUTER,
      amount,
      whale
    );
    const path = [
      "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
      "0x6b175474e89094c44da98b954eedeac495271d0f",
      "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    ];

    const t1 = CalldataGenerator.swapTokens(amount, path, whale, 0);

    const calls: any = [
      {
        from: transactionData?.txObj.from,
        to: transactionData?.txObj.to,
        input: transactionData?.calldata,
      },
      { from: t1?.txObj.from, to: t1?.txObj.to, input: t1?.calldata },
    ];

    await this.executeBatch(calls, path);
  };
}
