import { prepareCall, executeCalls } from "../../arbitrumMulticall";
import defaultUniswap from "../../../../data/default_uniswap.json";
import {
  CHAIN_ID,
  MULTICALL_ADDRESS,
  UNISWAP_V3_FACTORY,
} from "../../../constants";
import { PairV3 } from "@prisma/client";
import { Interface, JsonRpcProvider, ethers } from "ethers";
import processEnvSafe from "../../../safeEnv";
import { MULTICALL_ABI_ETHERS, uniswapv3factory } from "../../abis";
import dotenv from "dotenv";
dotenv.config();
(async function () {
  const tokens = defaultUniswap["tokens"];

  let arbitrumTokens = tokens.filter(
    (token) => token["chainId"] === CHAIN_ID.ARBITRUM
  );

  let fees = [100, 500, 3000, 10000];

  const MAINNET_ARBITRUM_RPC_URL = processEnvSafe("MAINNET_ARBITRUM_RPC_URL");
  const provider = new JsonRpcProvider(MAINNET_ARBITRUM_RPC_URL);
  const contract = new ethers.Contract(
    UNISWAP_V3_FACTORY,
    uniswapv3factory,
    provider
  );

  let pools = [];
  for (let i = 0; i < arbitrumTokens.length; i++) {
    let calls = [];

    for (let j = i + 1; j < arbitrumTokens.length; j++) {
      for (let fee of fees) {
        let myinterface = new Interface([
          { inputs: [], stateMutability: "nonpayable", type: "constructor" },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: "uint24",
                name: "fee",
                type: "uint24",
              },
              {
                indexed: true,
                internalType: "int24",
                name: "tickSpacing",
                type: "int24",
              },
            ],
            name: "FeeAmountEnabled",
            type: "event",
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: "address",
                name: "oldOwner",
                type: "address",
              },
              {
                indexed: true,
                internalType: "address",
                name: "newOwner",
                type: "address",
              },
            ],
            name: "OwnerChanged",
            type: "event",
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: "address",
                name: "token0",
                type: "address",
              },
              {
                indexed: true,
                internalType: "address",
                name: "token1",
                type: "address",
              },
              {
                indexed: true,
                internalType: "uint24",
                name: "fee",
                type: "uint24",
              },
              {
                indexed: false,
                internalType: "int24",
                name: "tickSpacing",
                type: "int24",
              },
              {
                indexed: false,
                internalType: "address",
                name: "pool",
                type: "address",
              },
            ],
            name: "PoolCreated",
            type: "event",
          },
          {
            inputs: [
              { internalType: "address", name: "tokenA", type: "address" },
              { internalType: "address", name: "tokenB", type: "address" },
              { internalType: "uint24", name: "fee", type: "uint24" },
            ],
            name: "createPool",
            outputs: [
              { internalType: "address", name: "pool", type: "address" },
            ],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [
              { internalType: "uint24", name: "fee", type: "uint24" },
              { internalType: "int24", name: "tickSpacing", type: "int24" },
            ],
            name: "enableFeeAmount",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [{ internalType: "uint24", name: "", type: "uint24" }],
            name: "feeAmountTickSpacing",
            outputs: [{ internalType: "int24", name: "", type: "int24" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              { internalType: "address", name: "", type: "address" },
              { internalType: "address", name: "", type: "address" },
              { internalType: "uint24", name: "", type: "uint24" },
            ],
            name: "getPool",
            outputs: [{ internalType: "address", name: "", type: "address" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "owner",
            outputs: [{ internalType: "address", name: "", type: "address" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "parameters",
            outputs: [
              { internalType: "address", name: "factory", type: "address" },
              { internalType: "address", name: "token0", type: "address" },
              { internalType: "address", name: "token1", type: "address" },
              { internalType: "uint24", name: "fee", type: "uint24" },
              { internalType: "int24", name: "tickSpacing", type: "int24" },
            ],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              { internalType: "address", name: "_owner", type: "address" },
            ],
            name: "setOwner",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ]);

        calls.push({
          decodeResult: (result: string) => {
            return myinterface.decodeFunctionResult("getPool", result);
          },
          functionName: "getPool",
          functionInterface: myinterface,
          args: [arbitrumTokens[i], arbitrumTokens[j], fee],
          contractAddress: UNISWAP_V3_FACTORY,
          call: {
            target: UNISWAP_V3_FACTORY,

            allowFailure: true,
            callData: myinterface.encodeFunctionData("getPool", [
              arbitrumTokens[i].address,
              arbitrumTokens[j].address,
              fee,
            ]),
          },
        });
        // let poolAddr = await contract.getPool();

        // if (poolAddr != "0x0000000000000000000000000000000000000000") {
        //   console.log(poolAddr);
        //   pools.push(poolAddr);
        // }
      }
    }

    let executed = await executeCalls(calls);
    console.log(executed.length);
    pools.push(
      ...executed
        .filter(
          (e) =>
            (e[0] as any as string) !==
            "0x0000000000000000000000000000000000000000"
        )
        .map((e) => e[0])
    );
  }

  console.log(JSON.stringify(pools));

  // const rows: PairV3 = [];

  // console.log(arbitrumTokens);
})();
