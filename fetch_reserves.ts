import { Contract } from "ethers";
import fs from "fs";
import { provider, uniswapV2PairABI } from "./rpc_setup.js";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function getReserves(pairAddresses: string[]) {
  let contracts = [];
  for (let pairAddress of pairAddresses) {
    let contract = new Contract(pairAddress, uniswapV2PairABI, provider);
    contracts.push(contract);
  }

  let reservePromises = [];
  for (let contract of contracts) {
    let data: [
      Promise<string>,
      Promise<string>,
      Promise<[bigint, bigint, bigint]>
    ] = [contract.token0(), contract.token1(), contract.getReserves()];
    reservePromises.push(Promise.all(data));
  }

  return await Promise.all(reservePromises);
}

(async function () {
  let pairs = fs.readFileSync("./pairs.txt").toString();

  // split the array based on '\n' byte

  let lines = pairs.split("\n");
  console.log(lines);

  let jsonData: {
    [key in string]: {
      token0: string;
      token1: string;
      reserve0: string;
      reserve1: string;
    };
  } = {};
  for (let sti = 0; sti < lines.length; sti += 9) {
    console.log(sti);
    let reserves = await getReserves(
      lines.slice(sti, Math.min(sti + 9, lines.length))
    );

    for (let j = 0; j < reserves.length; j++) {
      let act_indx = sti + j;
      jsonData[lines[act_indx]] = {
        token0: reserves[j][0],
        token1: reserves[j][1],
        reserve0: reserves[j][2][0].toString(),
        reserve1: reserves[j][2][1].toString(),
      };
    }
    await sleep(1000);
  }

  fs.writeFileSync("./reserves.json", JSON.stringify(jsonData));
})();
