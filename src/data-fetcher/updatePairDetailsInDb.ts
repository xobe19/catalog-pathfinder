import { Pair, PrismaClient } from "@prisma/client";
import { Result } from "ethers";
import fs from "fs";
import path from "path";
import { executeCalls, prepareCall } from "./multicall";
import axios from "axios";
import { updateTimeStamp } from "../timestamp";

const prisma = new PrismaClient();

type ResultWithMetadata = {
  results: Result[];
  start: number;
  size: number;
};

type PairReserves = Pick<Pair, "address" | "token0Reserve" | "token1Reserve">;

function getMulticallBatch(
  pairAddresses: string[],
  start: number,
  size: number
): Promise<ResultWithMetadata> {
  const calls = [];
  for (let i = 0; i < size; i++) {
    calls.push(
      prepareCall(
        pairAddresses[i + start],
        "getReserves",
        "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
      )
    );
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

function getValuesStringFromExecuteCallsResult(
  pairAddress: string[],
  executeCallsResults: Result[]
): string[] {
  const ret = [];

  let j = 0;
  for (let i = 0; i < executeCallsResults.length; i += 3) {
    const reserves = executeCallsResults[i + 0];

    const pair: PairReserves = {
      address: pairAddress[j++],
      token0Reserve: reserves[0].toString(),
      token1Reserve: reserves[1].toString(),
    };
    ret.push(
      `('${pair.address}', '${pair.token0Reserve}', '${pair.token1Reserve}')`
    );
  }

  return ret;
}

function toDbUpdateQuery(
  pairAddresses: string[],
  results: ResultWithMetadata[]
): string {
  const valuesClauses = [];
  for (const resultBatch of results) {
    let i = 0;

    valuesClauses.push(
      ...getValuesStringFromExecuteCallsResult(
        pairAddresses.slice(
          resultBatch.start,
          resultBatch.start + resultBatch.size
        ),
        resultBatch.results
      )
    );
  }
  return valuesClauses.join(", ");
}

async function main() {
  console.log(new Date().toLocaleString());
  console.time("service time");

  const pairAddressesFilePath = path.join(
    __dirname,
    "data",
    "uniswap_v2_pair_addresses.csv"
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
        await prisma.$executeRawUnsafe(
          `UPDATE "Pair"
          SET "token0Reserve" = new_values.new_token0_reserve,
              "token1Reserve" = new_values.new_token1_reserve
          FROM (
              VALUES 
              ${toDbUpdateQuery(pairAddresses, results)}
                  -- Add more rows for other updates
              ) AS new_values (address, new_token0_reserve, new_token1_reserve)
          WHERE "Pair".address = new_values.address;`
        );
        console.log(`updated rows in db: ${i + size}`);
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
