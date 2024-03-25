import { Result } from "ethers";
import fs from "fs/promises";
import path from "path";
import { CONTRACT } from "../../../constants";
import { executeCalls, prepareCall } from "../../arbitrumMulticall";

async function getAllPairsLength() {
  const calls = [
    prepareCall(
      CONTRACT.ARBITRUM.SUSHISWAP,
      "allPairsLength",
      "function allPairsLength() external view returns (uint)"
    ),
  ];
  return (await executeCalls(calls))[0][0];
}

function multiCallBatch(start: bigint, len: bigint) {
  const calls = [];
  for (let i = start; i < len; i++) {
    calls.push(
      prepareCall(
        CONTRACT.ARBITRUM.SUSHISWAP,
        "allPairs",
        "function allPairs(uint) external view returns (address pair)",
        [i]
      )
    );
  }
  return executeCalls(calls);
}

function resultsToData(results: Result[]): string[] {
  return results.map((res) => res[0].toLowerCase());
}

function min(a: bigint, b: bigint) {
  if (a < b) return a;
  return b;
}

async function main() {
  console.time("time taken");
  const multicallBatchSize = BigInt(100);
  const start = BigInt(0);
  const filePath = path.join(
    __dirname,
    "../../../../",
    "data",
    "sushiswap_arbitrum_pair_addresses.txt"
  );
  const file = await fs.open(filePath, "w");

  const len = await getAllPairsLength();

  for (let i = start; i < len; i += multicallBatchSize) {
    const sz = min(len - i, multicallBatchSize);
    const batch = await multiCallBatch(i, i + sz);
    file.write(resultsToData(batch).join("\n") + "\n");
    console.log(`Wrote ${i} to ${i + sz - BigInt(1)}`);
  }

  console.log(`Wrote to ${filePath}`);
  file.close();
  console.timeLog("time taken");
}
main();
