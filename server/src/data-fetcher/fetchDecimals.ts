import fs from "fs";
import { executeCalls, prepareCall } from "./multicall";

async function getAllTokens() {
  return fs.readFileSync("../../data/tokenadddress.txt", "utf-8").split("\n");
}

async function fetchDecimals() {
  const TOKENS = await getAllTokens();
  const calls: any[] = [];
  const start = 1000;
  const end = 2000;
  const batchSize = 3;
  const failedTokens: any[] = [];

  const results: any[] = [];
  for (let i = start; i < end; i += batchSize) {
    const inter = [];
    const batchTokens = TOKENS.slice(i, i + batchSize);
    try {
      for (let j = 0; j < batchTokens.length; j++) {
        inter.push(
          prepareCall(
            batchTokens[j],
            "decimals",
            "function decimals() public view returns (uint8)"
          )
        );
      }
      const res = await executeCalls(inter);
      const arr = { address: batchTokens, decimals: res };
      results.push(arr);
    } catch (error) {
      console.log(batchTokens);
      failedTokens.push(batchTokens);
    }
  }
  console.log(failedTokens);
  // const query = await prisma.$executeRawUnsafe();
}

fetchDecimals();
