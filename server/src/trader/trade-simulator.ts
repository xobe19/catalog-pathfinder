import axios from "axios";
import * as dotenv from "dotenv";
import { UNISWAP_V2_ROUTER, swapperContractAddress } from "../constants";
import processEnvSafe from "../safeEnv";
import { tenderlyTxObj } from "../types";
import { CalldataGenerator } from "./calldataGenerator";
import { getMaxTokenHolder } from "./getMaxTokenHolder";
dotenv.config();

const TENDERLY_ACCESS_KEY = processEnvSafe("TENDERLY_API");

export class Simulator {
  static executeBatch = async (
    transactions: tenderlyTxObj[],
    path: string[],
    block_number?: number
  ) => {
    try {
      const res =
        // https://api.tenderly.co/api/v1/account/vikasrushi/project/project/
        (
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
    console.log(from_address);
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

  static async getTxObj() {
    const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
    const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
    const SEED = "0x5eed99d066a8caf10f3e4327c1b3d8b673485eed";

    const walletAddress = await getMaxTokenHolder(USDC);
    const path = [USDC, WETH, SEED];
    const transactionData = CalldataGenerator.approveTokens(
      path[0],
      swapperContractAddress,
      BigInt("8000000000"),
      walletAddress
    );
    const calls = [];
    calls.push(transactionData?.txObj);

    const callData = CalldataGenerator.generateV3(
      [USDC, WETH, SEED],
      [100, 3000],
      walletAddress,
      "4000000000"
    );

    const txObjSwap = {
      to: swapperContractAddress,
      from: walletAddress,
      data: callData,
    };
    calls.push(txObjSwap);
    return calls;
  }
  public static testSeed = async () => {
    console.time("Batch Simulation");
    const txArr = await this.getTxObj();
    const tx1 = txArr[0];
    const tx2 = txArr[1];
    console.log(tx2);
    (
      await axios.post(
        `https://api.tenderly.co/api/v1/account/hiteshlwni/project/project/simulate-bundle`,
        {
          simulations: [
            {
              network_id: "1",
              save: true,
              save_if_fails: true,
              simulation_type: "full",
              to: tx1?.to,
              from: tx1?.from,
              input: tx1?.data,
              state_objects: {},
            },
            {
              network_id: "1",
              save: true,
              save_if_fails: true,
              simulation_type: "full",
              to: tx2?.to,
              from: tx2?.from,
              input: tx2?.data,
              state_objects: {},
            },
          ],
        },
        {
          headers: {
            "X-Access-Key": TENDERLY_ACCESS_KEY as string,
          },
        }
      )
    ).data;
    console.timeEnd("Batch Simulation");
  };
}

Simulator.testSeed().then((e) => {
  console.log(e);
});
