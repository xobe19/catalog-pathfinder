import fs from "fs";
import { executeCalls, prepareCall } from "./multicall";

async function main(batchSize: number) {
  const getPairLengthCall = [
    prepareCall(
      "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
      "allPairsLength",
      "function allPairsLength() external view returns (uint)"
    ),
  ];

  const length = (await executeCalls(getPairLengthCall))[0].toString();

  const calls = [];
  for (let i = 0; i < parseInt(length); i++) {
    calls.push(
      prepareCall(
        "0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac",
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

  fs.writeFileSync("sushiswapPairs.json", JSON.stringify(res.flat()));
}

main(2);
