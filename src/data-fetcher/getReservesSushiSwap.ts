import { executeCalls, prepareCall } from "./multicall";
import fs from "fs";

async function getReserves() {
  const allpairs = fs.readFileSync("sushiswapPairs.txt").toString().split("\n");

  const calls = [];
  for (let i = 0; i < allpairs.length; i++) {
    calls.push(
      prepareCall(
        allpairs[i],
        "getReserves",
        "function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)"
      )
    );
  }

  const batchSize = 2;
  const promiseArray = [];
  for (let i = 0; i < calls.length; i += batchSize) {
    promiseArray.push(calls.slice(i, i + batchSize));
  }

  const res = await executeCalls(calls);
  console.log(res);
}

getReserves();
