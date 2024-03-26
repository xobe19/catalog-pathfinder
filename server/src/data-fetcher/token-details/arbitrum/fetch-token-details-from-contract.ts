import { Token } from "@prisma/client";
import dotenv from "dotenv";
import { Result, ethers } from "ethers";
import { CHAIN_ID } from "../../../constants";
import { prisma } from "../../../services/dbClient";
import { decodeFunction } from "../../../types";
import { executeCalls, prepareCall } from "../../arbitrumMulticall";
dotenv.config();

/**
 * name, symbol, decimal
 */
const DATA_COUNT = 3;

const decodeMulticallResult: decodeFunction = (result, call) => {
  // try with abi
  try {
    return call.decodeResult(result.returnData)[0];
  } catch (e) {
    console.error(
      `failed to decode ${call.functionName} of ${call.contractAddress} with abi`
    );
    // try bytes32
    try {
      return ethers.decodeBytes32String(result.returnData);
    } catch (e) {
      console.error(
        `failed to decode ${call.functionName} of ${call.contractAddress} with bytes32`
      );
    }
  }
  return null;
};

function quote(val: any) {
  if (!val) return null;
  return `'${val}'`;
}

function getTokenDetailsFromExecuteCallsResult(
  tokenAddress: string[],
  executeCallsResults: Result[]
) {
  const ret = [];

  let j = 0;
  for (let i = 0; i < executeCallsResults.length; i += 3) {
    const name = executeCallsResults[i + 0];
    const symbol = executeCallsResults[i + 1];
    const decimals = executeCallsResults[i + 2];

    const token: Token = {
      id: tokenAddress[j++],
      name:
        name === null || name.toString().trim().length === 0
          ? null
          : name.toString().trim() === undefined
          ? null
          : name.toString().trim(),
      symbol:
        symbol === null || symbol.toString().trim().length === 0
          ? null
          : symbol.toString().trim() === undefined
          ? null
          : symbol.toString().trim(),
      decimals: decimals === null ? null : Number(decimals),
      chainId: CHAIN_ID.ETHEREUM,
    };
    ret.push(token);
  }

  return ret;
}

function toDb(tokenAddresses: string[], results: ResultWithMetadata[]) {
  const ret: Token[] = [];
  for (const resultBatch of results) {
    let i = 0;

    ret.push(
      ...getTokenDetailsFromExecuteCallsResult(
        tokenAddresses.slice(
          resultBatch.start,
          resultBatch.start + resultBatch.size
        ),
        resultBatch.results
      )
    );
  }
  return ret;
}

type ResultWithMetadata = {
  results: Result[];
  start: number;
  size: number;
};

function getCallsForTokenDetails(tokenAddress: string) {
  return [
    prepareCall(
      tokenAddress,
      "name",
      "function name() public view returns (string)"
    ),
    prepareCall(
      tokenAddress,
      "symbol",
      "function symbol() public view returns (string)"
    ),
    prepareCall(
      tokenAddress,
      "decimals",
      "function decimals() public view returns (uint8)"
    ),
  ];
}

function getMulticallBatch(
  tokenAddresses: string[],
  start: number,
  size: number
): Promise<ResultWithMetadata> {
  const calls = [];
  for (let i = 0; i < size; i++) {
    calls.push(...getCallsForTokenDetails(tokenAddresses[i + start]));
  }
  const promiseOfResults = executeCalls(calls, decodeMulticallResult);

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

async function main() {
  console.log(new Date().toLocaleString());
  console.time("service time");

  try {
    const tokenAddresses = (
      await prisma.token.findMany({
        where: {
          OR: [{ decimals: null }, { name: null }, { symbol: null }],
          chainId: CHAIN_ID.ARBITRUM,
          id: { notIn: ["0x7d28ef69bd63557ef61e96404f27cadd6c2832fd"] },
        },
        select: {
          id: true,
        },
      })
    ).map((tok) => tok.id);
    console.log(`${tokenAddresses.length} token addresses read from db`);

    // no. of contract read calls to batch into 1 RPC call
    const multicallbatchSize = 100;
    // no. of RPC calls to execute at a time
    let promiseBatchSize = 10;

    let promiseBatch: Promise<ResultWithMetadata>[] = [];
    let resCount = 0;
    console.log("Token data fetch start");
    for (let i = 0; i < tokenAddresses.length; i += multicallbatchSize) {
      const size = Math.min(multicallbatchSize, tokenAddresses.length - i);
      const res = getMulticallBatch(tokenAddresses, i, size);
      promiseBatch.push(res);
      resCount += 1;

      if (size === tokenAddresses.length - i || resCount === promiseBatchSize) {
        const results = await Promise.all(promiseBatch);
        const tokens = toDb(tokenAddresses, results);
        for (const token of tokens) {
          try {
            await prisma.token.update({
              where: {
                id_chainId: { id: token.id, chainId: CHAIN_ID.ARBITRUM },
              },
              data: {
                name: token.name,
                symbol: token.symbol,
                decimals: token.decimals,
              },
            });
          } catch (ex) {
            const err = ex as Error;
            console.log(`error with token ${JSON.stringify(token)}`);
            console.error(err.message);
          }
        }

        console.log(`updated rows in db: ${i + size}`);
        resCount = 0;
        promiseBatch = [];
      }
    }
    console.log("Token data fetch end");
  } catch (error) {
    console.error(error);
  }

  console.timeEnd("service time");
  console.log(new Date().toLocaleString());
}

main();
