import { Pair, PrismaClient } from "@prisma/client";
import * as fs from "node:fs/promises";

const prisma = new PrismaClient();

function rowToData(row: string) {
  const [
    address,
    nope1,
    token0address,
    token0quantity,
    nope2,
    token1address,
    token1quantity,
  ] = row.split(",");

  return [
    address,
    token0address,
    token0quantity,
    token1address,
    token1quantity,
  ];
}

function createBatch(start: number, end: number, rows: any[]) {
  const calls = [];
  for (let i = start; i < end; i++) {
    const single = rowToData(rows[i]);
    calls.push(single);
  }
  return calls;
}

async function addToDb(pairs: any[]) {
  const pairsToAdd = pairs.map((pairData) => {
    const [
      address,
      token0Address,
      token0Reserve,
      token1Address,
      token1Reserve,
    ] = pairData;
    const pair: Pair = {
      address,
      token0Address,
      token1Address,
      token0Reserve,
      token1Reserve,
    };
    return pair;
  });

  await prisma.pair.createMany({
    data: pairsToAdd,
  });
}

async function main() {
  const count = 1000;
  try {
    const fileRef = await fs.readFile("./pairs.csv", "utf-8");
    const rows = fileRef.split("\n");
    // console.log(rows[0]);

    for (let i = 0; i < rows.length; i += count) {
      const start = i;
      const end = Math.min(i + count, rows.length);
      const res = await Promise.all(createBatch(start, end, rows));
      await addToDb(res);
      console.log("batch pushed to db", i);
      i++;
    }
  } catch (error) {
    console.log(error);
  }
}

main();
