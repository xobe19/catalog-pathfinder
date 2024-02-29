import fs from "fs";
import { prepareCall } from ".";
import { executeCalls } from "./single-function-no-args";
import { PairSchemaRef } from "./mongo-client";

async function getPairDetails(pairAddress: string) {
  const calls = [
    prepareCall(
      pairAddress,
      "getReserves",
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
    ),
    prepareCall(
      pairAddress,
      "token0",
      "function token0() external view returns (address)"
    ),
    prepareCall(
      pairAddress,
      "token1",
      "function token1() external view returns (address)"
    ),
  ];

  const [reserves, token0, token1] = await executeCalls(calls);

  const token0Address = token0[0];
  const token1Address = token1[0];

  // let pairsInfo = await getTokenDetails(token0Address, token1Address, false);

  const ret = {
    address: pairAddress,
    token0: {
      address: token0Address,
      quantity: reserves[0],
      // decimal: Number(pairsInfo.decimalA),
    },
    token1: {
      address: token1Address,
      quantity: reserves[1],
      // decimal: Number(pairsInfo.decimalB),
    },
  };

  return ret;
}

async function getTokenDetails(
  tokenA: string,
  tokenB: string,
  is16bits?: boolean
) {
  try {
    const deciamlCall = is16bits
      ? "function decimals() public constant returns (uint16 decimals)"
      : "function decimals() public constant returns (uint8 decimals)";

    const calls = [
      prepareCall(tokenA, "decimals", deciamlCall),
      prepareCall(tokenB, "decimals", deciamlCall),
    ];

    var result = await executeCalls(calls);

    const decimalA = result[0] ? result[0] : -1;
    const decimalB = result[1] ? result[1] : -1;

    return {
      decimalA: decimalA,
      decimalB: decimalB,
    };
  } catch (error) {
    getTokenDetails(tokenA, tokenB, true);
  }
}

async function main() {
  try {
    const fileRef = fs.readFileSync("./addresses.csv", "utf-8");
    const pairsAddress = fileRef.split("\n");

    function createBatch(start: number, end: number) {
      const calls = [];
      for (let i = start; i < end; i++) {
        calls.push(getPairDetails(pairsAddress[i]));
      }
      return calls;
    }

    const totalReqs = pairsAddress.length;
    for (let i = 0; i < totalReqs; i += 1000) {
      const start = i;
      const end = Math.min(i + 1000, totalReqs);
      const res = await Promise.all(createBatch(start, end));
      await PairSchemaRef.insertMany(res);
      console.log("batch pushed to db", i);
      i++;
    }
  } catch (error) {
    console.log(error);
  }
}

main();
