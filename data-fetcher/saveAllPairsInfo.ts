import { parse } from "csv-parse";
import fs from "fs";
import { prepareCall } from ".";
import { executeCalls } from "./single-function-no-args";

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

  const token0Address = token0[0];
  const token1Address = token1[0];

  let pairsInfo = await getTokenDetails(token0Address, token1Address);

  const ret = {
    address: pairAddress,
    token0: {
      address: token0Address,
      quantity: reserves[0],

      decimal: Number(pairsInfo.decimalA),
    },
    token1: {
      address: token1Address,
      quantity: reserves[1],
      decimal: Number(pairsInfo.decimalB),
    },
  };

  return ret;
}

async function getTokenDetails(tokenA: string, tokenB: string) {
  const calls = [
    prepareCall(
      tokenA,
      "decimals",
      "function decimals() public constant returns (uint8 decimals)"
    ),
    prepareCall(
      tokenB,
      "decimals",
      "function decimals() public constant returns (uint8 decimals)"
    ),
  ];

  var result = await executeCalls(calls);

  const decimalA = result[0] ? result[0] : -1;
  const decimalB = result[1] ? result[1] : -1;

  return {
    decimalA: decimalA,
    decimalB: decimalB,
  };
}

async function main() {
  try {
    const records: any = [];

    const parser = parse({
      delimiter: ",",
    });

    fs.createReadStream("./addresses.csv").pipe(parser);

    let lines = 1;
    const endLines = 309146;

    const calls: any = [];

    parser.on("readable", function () {
      let record;
      while ((record = parser.read()) !== null) {
        lines++;
        const s = record.toString();

      }
    })
    parser.on("readable", function () {
        // records.push(s);
        // Promise.resolve(getPairDetails(s))
        // calls.push(getPairDetails(s));
        // if (lines === 100) {
        //   Promise.all(calls).then((res) => {
        //     console.log(res);
        //   });
          break;
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
}

main();
