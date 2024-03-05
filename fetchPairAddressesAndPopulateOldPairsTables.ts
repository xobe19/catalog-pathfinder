/* TODO: remove ts-nocheck */
// @ts-nocheck

import { Pair, PrismaClient } from "@prisma/client";
import { executeCalls, prepareCall } from "./multicall";
import { UniswapV2Factory_ADDRESS } from "./constants";

const prisma = new PrismaClient();

async function fetchPairAddresses(
  start: number,
  count: number
): Promise<Pick<Pair, "index" | "address">[]> {
  const calls = [];

  /** maps `calls` array location and pair `index` */
  const i_pairIndex_Mapping: {
    [k in number]: number;
  } = {};

  // batch all calls
  for (let i = 0; i < count; i++) {
    const index = i + start;

    const prepCall = prepareCall(
      UniswapV2Factory_ADDRESS,
      "allPairs",
      "function allPairs(uint) external view returns (address pair)",
      [BigInt(index)]
    );
    i_pairIndex_Mapping[i] = index;
    calls.push(prepCall);
  }

  const results = await executeCalls(calls);

  const partialPairs: Pick<Pair, "index" | "address">[] = results.map(
    (result, i) => ({
      address: result[0],
      index: i_pairIndex_Mapping[i],
    })
  );

  return partialPairs;
}

async function addToDb(pairs: Pick<Pair, "index" | "address">[]) {
  await prisma.pair.createMany({
    data: [...pairs],
  });
}

async function addToDbBatch(pairs: Pick<Pair, "index" | "address">[][]) {
  const batch = pairs.map((pair) => addToDb(pair));
  await Promise.all(batch);
}

async function main() {
  const count = 1000;
  let start = 0;

  let batch = [];
  for (let i = 0; i < 3000; i++) {
    // fetch 1000 pair addresses
    const res = fetchPairAddresses(start, count); // 1 rpc
    if (batch.length < 10) {
      batch.push(res);
    } else {
      console.log(`batch formed, fetching...`);
      // fetch 10 * 1000 = 10000 pair addresses
      const fetchedData = await Promise.all(batch);
      console.log(`batch fetched`);

      console.log("adding batch to db...");
      await addToDbBatch(fetchedData);
      console.log("added batch to db");
      console.log(start);
      batch = [];
    }
    start = start + count;
  }
}

// main();
