import fs from "fs";
import { CONTRACT } from "../constants";
import { executeCalls, prepareCall } from "./ethereumMulticall";

async function main(batchSize: number) {
  const getPairLengthCall = [
    prepareCall(
      CONTRACT.ETHEREUM.PANCAKESWAP,
      "allPairsLength",
      "function allPairsLength() external view returns (uint)"
    ),
  ];

  const length = (await executeCalls(getPairLengthCall))[0].toString();

  const calls = [];
  for (let i = 0; i < parseInt(length); i++) {
    calls.push(
      prepareCall(
        CONTRACT.ETHEREUM.PANCAKESWAP,
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
