import fs from "fs";
import { Contract } from "ethers";
import { TOP_PAIRS } from "./constant.js";
import { provider, upgradableContractABI } from "./rpc_setup.js";
import { Pair } from "./data-fetcher/types.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DecimalAbi = [
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const getReservesABI = [
  {
    constant: true,
    inputs: [],
    name: "getReserves",
    outputs: [
      { internalType: "uint112", name: "_reserve0", type: "uint112" },
      { internalType: "uint112", name: "_reserve1", type: "uint112" },
      { internalType: "uint32", name: "_blockTimestampLast", type: "uint32" },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];
async function getTokenDecimal(contractAddress: string) {
  let decimal = "";
  try {
    const contractInstance = new Contract(
      contractAddress,
      DecimalAbi,
      provider
    );
    decimal = await contractInstance.decimals();
  } catch (error) {
    const upgradableContractInstance = new Contract(
      contractAddress,
      upgradableContractABI,
      provider
    );
    const contractAdd = await upgradableContractInstance.implementation();
    getTokenDecimal(contractAdd);
  }
  return parseInt(decimal);
}

async function getReserves(contractAddress: string) {
  const contractInstance = new Contract(
    contractAddress,
    getReservesABI,
    provider
  );
  const res = await contractInstance.getReserves();
  const reserve0 = res[0];
  const reserve1 = res[1];
  return { reserve0: reserve0, reserve1: reserve1 };
}

async function main() {
  const allPairs: Pair[] = [];
  let index = 0;
  for await (let i of TOP_PAIRS) {
    try {
      const pair = i.id;
      const tokenA = i.token0.id;
      const tokenB = i.token1.id;
      const tokenASymbol = i.token0.symbol;
      const tokenBSymbol = i.token1.symbol;
      const decimalA = await getTokenDecimal(tokenA);
      const decimalB = await getTokenDecimal(tokenB);
      const reserves = await getReserves(pair);
      const newPair: Pair = {
        address: pair,
        token0: {
          address: tokenA,
          quantity: reserves?.reserve0.toString(),
          decimal: decimalA,
          symbol: tokenASymbol,
        },
        token1: {
          address: tokenB,
          quantity: reserves?.reserve1.toString(),
          decimal: decimalB,
          symbol: tokenBSymbol,
        },
      };
      console.log("completed ", index);

      allPairs.push(newPair);
      await sleep(333);
      index++;
    } catch (error) {
      // console.log(error);
    }
  }
  fs.writeFile("top_pairs.json", JSON.stringify(allPairs), () => {
    console.log("writen completed");
  });
}

main();
