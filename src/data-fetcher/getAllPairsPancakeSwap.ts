import fs from "fs";
import { executeCalls, prepareCall } from "./multicall";

async function main(batchSize: number) {
  const getPairLengthCall = [
    prepareCall(
      "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
      "allPairsLength",
      "function allPairsLength() external view returns (uint)"
    ),
  ];

  const length = (await executeCalls(getPairLengthCall))[0].toString();

  const calls = [];
  for (let i = 0; i < parseInt(length); i++) {
    calls.push(
      prepareCall(
        "0x1097053Fd2ea711dad45caCcc45EfF7548fCB362",
        "allPairs",
        "function allPairs(uint) external view returns (address pair)",
        [i]
      )
    );
  }

  const promiseArray = [];
  for (let i = 0; i < calls.length; i += batchSize) {
    promiseArray.push(calls.slice(i, i + batchSize));
  }
  const res = await executeCalls(calls);

  fs.writeFileSync("pancakeSwap.json", JSON.stringify(res.flat()));
}

main(2);
