import { Pair, PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { executeCalls, prepareCall } from ".";

const prisma = new PrismaClient();

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

  const token0Address = (token0[0] as bigint).toString();
  const token1Address = (token1[0] as bigint).toString();

  const ret: Pair = {
    address: pairAddress,
    token0Address,
    token1Address,
    token0Reserve: reserves[0].toString(),
    token1Reserve: reserves[1].toString(),
  };

  return ret;
}

async function main() {
  console.log(new Date().toLocaleString());

  const batchSize = 1000;

  // clear the db first
  await prisma.pair.deleteMany({});
  console.log("db cleared");

  const pairAddressFilePath = path.join(__dirname, "addresses.csv");

  try {
    const fileRef = fs.readFileSync(pairAddressFilePath, "utf-8");
    const pairsAddress = fileRef.split("\n");
    console.log(`Pair addresses read from ${pairAddressFilePath}`);

    function createBatch(start: number, end: number) {
      const calls = [];
      for (let i = start; i < end; i++) {
        calls.push(getPairDetails(pairsAddress[i]));
      }

      return calls;
    }

    const totalReqs = pairsAddress.length;
    console.log("Pair data fetch start");
    for (let i = 0; i < totalReqs; i += batchSize) {
      const start = i;
      const end = Math.min(i + batchSize, totalReqs);
      const res = await Promise.all(createBatch(start, end));
      await prisma.pair.createMany({ data: res });
      console.log("batch pushed to db", i);
      i++;
    }
    console.log("Pair data fetch end");
  } catch (error) {
    console.error(error);
  }

  console.log(new Date().toLocaleString());
}

main();
