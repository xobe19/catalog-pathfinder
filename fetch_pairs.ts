import fs from "fs";
import { uniswapV2FactoryContract } from "./rpc_setup";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function promiseCreator() {
  let lastPromiseCreated = -1;

  return function getNextPromiseBatch(batch_size: number) {
    let batch = [];
    while (batch_size-- > 0) {
      batch.push(uniswapV2FactoryContract.allPairs(++lastPromiseCreated));
    }
    return batch;
  };
}

(async function () {
  const num_pairs = await uniswapV2FactoryContract.allPairsLength();
  console.log(num_pairs);

  // fetch the first 1000 pairs
  // 67 batches

  let pairAddresses: string[] = [];

  let getNextPromiseBatch = promiseCreator();

  for (let i = 0; i < 67; i++) {
    console.log(i);
    let values = await Promise.all(getNextPromiseBatch(15));
    await sleep(1000);
    pairAddresses.push(...(values as string[]));
  }

  for (let pair of pairAddresses) {
    fs.appendFileSync("./pairs.txt", pair + "\n");
  }
})();
