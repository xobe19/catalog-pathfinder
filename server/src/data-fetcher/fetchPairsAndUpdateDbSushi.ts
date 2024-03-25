import { Pair, PairSushiSwap } from "@prisma/client";
import { Result } from "ethers";
import fs from "fs";
import path from "path";
import { CHAIN_ID } from "../constants";
import { prisma } from "../services/dbClient";
import { executeCalls, prepareCall } from "./ethereumMulticall";
import { updateTimeStamp } from "./timestamp";

type ResultWithMetadata = {
  results: Result[];
  start: number;
  size: number;
};

function getCallsForPairDetails(pairAddress: string) {
  return [
    prepareCall(
      pairAddress,
      "getReserves",
      "function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32  _blockTimestampLast)"
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
}

function getMulticallBatch(
  pairAddresses: string[],
  start: number,
  size: number
): Promise<ResultWithMetadata> {
  const calls = [];
  for (let i = 0; i < size; i++) {
    calls.push(...getCallsForPairDetails(pairAddresses[i + start]));
  }
  const promiseOfResults = executeCalls(calls);

  return new Promise((resolve, reject) => {
    promiseOfResults
      .then((results) =>
        resolve({
          results: results,
          start,
          size,
        })
      )
      .catch((err) => reject(err));
  });
}

function getPairDetailsFromExecuteCallsResult(
  pairAddress: string[],
  executeCallsResults: Result[]
): PairSushiSwap[] {
  const ret = [];
  // console.log(pairAddress);
  let j = 0;
  for (let i = 0; i < executeCallsResults.length; i += 3) {
    const reserves = executeCallsResults[i + 0];
    const token0 = executeCallsResults[i + 1];
    const token1 = executeCallsResults[i + 2];

    const token0Address = (token0[0] as bigint).toString();
    const token1Address = (token1[0] as bigint).toString();

    const pair: PairSushiSwap = {
      address: pairAddress[j++],
      token0Address,
      token1Address,
      token0Reserve: reserves[0].toString(),
      token1Reserve: reserves[1].toString(),
      chainId: CHAIN_ID.ETHEREUM,
    };
    console.log(pair);
    ret.push(pair);
  }

  return ret;
}

function toDbPairs(pairAddresses: string[], results: ResultWithMetadata[]) {
  const pairs: Pair[] = [];
  for (const resultBatch of results) {
    let i = 0;

    console.log(pairs);

    pairs.push(
      ...getPairDetailsFromExecuteCallsResult(
        pairAddresses.slice(
          resultBatch.start,
          resultBatch.start + resultBatch.size
        ),
        resultBatch.results
      )
    );
  }
  return pairs;
}

async function main() {
  console.log(new Date().toLocaleString());
  console.time("service time");

  // ! clear the db first
  await prisma.pairSushiSwap.deleteMany({});
  console.log("db cleared");

  const pairAddressesFilePath = path.join(
    __dirname,
    "../../data",
    "sushiswapPairs.txt"
  );

  try {
    const fileRef = fs.readFileSync(pairAddressesFilePath, "utf-8");
    const pairAddresses = fileRef.split("\n");
    if (pairAddresses[pairAddresses.length - 1] === "") pairAddresses.pop();
    console.log(`Pair addresses read from ${pairAddressesFilePath}`);

    // no. of contract read calls to batch into 1 RPC call
    const multicallbatchSize = 500;
    // no. of RPC calls to execute at a time
    let promiseBatchSize = 20;

    let promiseBatch: Promise<ResultWithMetadata>[] = [];
    let resCount = 0;
    console.log("Pair data fetch start");
    for (let i = 0; i < pairAddresses.length; i += multicallbatchSize) {
      const size = Math.min(multicallbatchSize, pairAddresses.length - i);
      const res = getMulticallBatch(pairAddresses, i, size);
      promiseBatch.push(res);
      resCount += 1;

      if (size === pairAddresses.length - i || resCount === promiseBatchSize) {
        const results = await Promise.all(promiseBatch);
        await prisma.pairSushiSwap.createMany({
          data: toDbPairs(pairAddresses, results),
        });
        console.log(`rows in db: ${i + size}`);
        resCount = 0;
        promiseBatch = [];
      }
    }
    console.log("Pair data fetch end");
  } catch (error) {
    console.error(error);
  }

  console.timeEnd("service time");
  console.log(new Date().toLocaleString());
  updateTimeStamp();
}

main();
