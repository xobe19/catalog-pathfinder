import tokensJson from "../../data/extended_uniswap.json";
import {
  PairBigInt,
  PairV3BigInt,
  PancakeSwapPairBigInt,
  SushiPairBigInt,
} from "../types";
import { ValueOf } from "./../types";
import { prisma } from "./dbClient";
import { getAmountOutV3 } from "./getAmountV3";

export const dexes = {
  uniswapV2: "Uniswap V2",
  uniswapV3: "Uniswap V3",
  sushiSwap: "SushiSwap",
  pancakeSwap: "PancakeSwap",
  all: "All",
} as const;

let safeTokens = new Set<string>(
  tokensJson["tokens"]
    .filter((e) => e.chainId === 1)
    .map((e) => e.address.toLowerCase())
);
function disp(
  addr: Set<String>,
  intermediate_path: Set<bigint>,
  token_from_pool: Array<string>
) {
  let len = addr.size;
  let itr_1 = addr.values();
  let itr_2 = intermediate_path.values();

  const ret = [];
  for (let i = 0; i < len; i++) {
    ret.push([
      itr_1.next().value,
      itr_2.next().value.toString(),
      token_from_pool[i],
    ]);

    // console.log(ret[ret.length - 1]);
  }
  return ret;
}

const data = {
  gooch: { address: "0x6d3d490964205c8bc8ded39e48e88e8fde45b41f", decimal: -1 },
  wbtc: { address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", decimal: -1 },
  weth: { address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", decimal: -1 },
  flx: { address: "0x6243d8cea23066d098a15582d81a598b4e8391f4", decimal: -1 },
  wait: { address: "0x2559813bbb508c4c79e9ccce4703bcb1f149edd7", decimal: -1 },
  usdc: { address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimal: -1 },
  usdt: { address: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimal: -1 },
  shibainu: {
    address: "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
    decimal: -1,
  },
  maker: {
    address: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
    decimal: -1,
  },
  elon: {
    address: "0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3",
    decimal: 18,
  },
};

function formatDecimal(x: bigint, decimal: number) {
  let final_string = x.toString();
  let indx = final_string.length - decimal;
  final_string = final_string.slice(0, indx) + "." + final_string.slice(indx);
  return final_string;
}

async function getReservesFromDb(): Promise<
  (PairBigInt | SushiPairBigInt | PancakeSwapPairBigInt | PairV3BigInt)[]
> {
  const v2Pairs = await prisma.pair.findMany();
  const sushiPairs = await prisma.pairSushiSwap.findMany();
  const pancakePairs = await prisma.pairPancakeSwap.findMany();
  const uniswapV3Pairs = await prisma.pairV3.findMany();

  const toRet: (
    | PairBigInt
    | SushiPairBigInt
    | PancakeSwapPairBigInt
    | PairV3BigInt
  )[] = v2Pairs.map((e) => ({
    address: e.address.toLowerCase(),
    token0Address: e.token0Address.toLowerCase(),
    token0Reserve: BigInt(e.token0Reserve).valueOf(),
    token1Address: e.token1Address.toLowerCase(),
    token1Reserve: BigInt(e.token1Reserve).valueOf(),
    version: dexes.uniswapV2,
  }));

  const sushiPairsMapped: SushiPairBigInt[] = sushiPairs.map((e) => ({
    address: e.address.toLowerCase(),
    token0Address: e.token0Address.toLowerCase(),
    token0Reserve: BigInt(e.token0Reserve).valueOf(),
    token1Address: e.token1Address.toLowerCase(),
    token1Reserve: BigInt(e.token1Reserve).valueOf(),
    version: dexes.sushiSwap,
  }));

  const PanCakePairsMapped: PancakeSwapPairBigInt[] = pancakePairs.map((e) => ({
    address: e.address.toLowerCase(),
    token0Address: e.token0Address.toLowerCase(),
    token0Reserve: BigInt(e.token0Reserve).valueOf(),
    token1Address: e.token1Address.toLowerCase(),
    token1Reserve: BigInt(e.token1Reserve).valueOf(),
    version: dexes.pancakeSwap,
  }));
  const Uniswapv3PairsMapped: PairV3BigInt[] = uniswapV3Pairs.map((e) => ({
    address: e.address.toLowerCase(),
    token0Address: e.token0Address.toLowerCase(),
    token1Address: e.token1Address.toLowerCase(),
    tick: e.tick,
    fees: e.fees,
    version: dexes.uniswapV3,
  }));

  toRet.push(...sushiPairsMapped);
  toRet.push(...PanCakePairsMapped);
  toRet.push(...Uniswapv3PairsMapped);
  return toRet;
}

function getOutV2(
  in_token_res: bigint,
  out_token_res: bigint,
  inTokenAmt: bigint
) {
  let qty_token1_recieve = null;
  let st = BigInt(1),
    en = out_token_res;
  while (st <= en) {
    let mid = (st + en) / BigInt(2);
    let condition =
      inTokenAmt < in_token_res &&
      ((inTokenAmt + in_token_res) * BigInt(1000) - inTokenAmt * BigInt(3)) *
        ((out_token_res - mid) * BigInt(1000)) >=
        in_token_res * out_token_res * BigInt(1000000);
    if (condition) {
      qty_token1_recieve = mid;

      st = mid + BigInt(1);
    } else {
      en = mid - BigInt(1);
    }
  }
  return qty_token1_recieve;
}

export async function findPath(
  inTokenAddress: string,
  outTokenAddress: string,
  inAmt: bigint,
  graph: {
    [key in string]: [
      string,
      PairBigInt | SushiPairBigInt | PancakeSwapPairBigInt | PairV3BigInt
    ][];
  },
  tokensToExclude: Set<string>,
  dexes: Set<string>
): Promise<any[][] | string> {
  // console.log(graph[data.gooch.address]);

  let queue: {
    [key in string]: {
      path: Set<String>;
      qty: bigint;
      intermediate_path: Set<bigint>;
      token_from_pool: Array<string>;
    };
  } = {};

  queue[inTokenAddress] = {
    path: new Set(),
    qty: inAmt,
    intermediate_path: new Set(),
    token_from_pool: new Array(),
  };
  queue[inTokenAddress].path.add(inTokenAddress);
  queue[inTokenAddress].intermediate_path.add(inAmt);
  queue[inTokenAddress].token_from_pool.push("-");

  let HOPS = 3;

  while (HOPS-- > 0) {
    let new_queue: {
      [key in string]: {
        path: Set<String>;
        qty: bigint;
        intermediate_path: Set<bigint>;
        token_from_pool: Array<string>;
      };
    } = {};

    for (let addr in queue) {
      new_queue[addr] = {
        path: new Set(queue[addr].path),
        qty: queue[addr].qty,
        intermediate_path: new Set(queue[addr].intermediate_path),
        token_from_pool: [...queue[addr].token_from_pool],
      };
    }
    for (let addr in queue) {
      let qd = queue[addr];
      for (let [neighbour, p] of graph[addr]) {
        if (qd.path.has(neighbour)) continue;
        if (!dexes.has(p.version)) continue;
        if (tokensToExclude.has(neighbour)) continue;
        if (!safeTokens.has(neighbour) && neighbour !== outTokenAddress)
          continue;

        let new_qty;
        if (p.version !== "Uniswap V3") {
          let q1 = p.token0Reserve;
          let q2 = p.token1Reserve;
          if (p.token0Address != addr) {
            let tmp = q2;
            q2 = q1;
            q1 = tmp;
          }
          new_qty = getOutV2(q1.valueOf(), q2.valueOf(), qd.qty);
        } else {
          new_qty = getAmountOutV3(
            qd.qty.toString(),
            p.tick,
            addr,
            neighbour,
            p.fees
          );
        }

        if (!new_qty) continue;
        if (
          new_queue[neighbour] === undefined ||
          new_queue[neighbour].qty < new_qty
        ) {
          let new_path = new Set(qd.path);
          let new_intermediate_path = new Set(qd.intermediate_path);
          let new_token_from_pool = [...qd.token_from_pool];
          new_path.add(neighbour);
          new_intermediate_path.add(new_qty);
          new_token_from_pool.push(p.version);

          new_queue[neighbour] = {
            path: new_path,
            qty: new_qty,
            intermediate_path: new_intermediate_path,
            token_from_pool: new_token_from_pool,
          };
        }
      }
    }
    queue = new_queue;
  }

  if (queue[outTokenAddress] === undefined) {
    return "No Path found";
  }
  const s = disp(
    queue[outTokenAddress].path,
    queue[outTokenAddress].intermediate_path,
    queue[outTokenAddress].token_from_pool
  );
  return s;
}

export async function findPaths(
  inTokenAddress: string,
  outTokenAddress: string,
  inAmt: bigint
): Promise<{
  [k in ValueOf<typeof dexes>]: string | string[][];
}> {
  const graph: {
    [key in string]: [
      string,
      PairBigInt | SushiPairBigInt | PancakeSwapPairBigInt | PairV3BigInt
    ][];
  } = {};

  const reserves = await getReservesFromDb();

  console.log(`fetched ${reserves.length} rows from db`);

  for (let pair of reserves) {
    let token0 = pair.token0Address;
    let token1 = pair.token1Address;
    if (!graph[token0]) graph[token0] = [];
    graph[token0].push([token1, pair]);
    if (!graph[token1]) graph[token1] = [];
    graph[token1].push([token0, pair]);
  }

  let exclude = new Set<string>();
  let boundFunction = findPath.bind(
    null,
    inTokenAddress,
    outTokenAddress,
    inAmt,
    graph,
    exclude
  );
  let a = new Set<string>();
  let b = new Set<string>();
  let c = new Set<string>();
  let d = new Set<string>();
  let e = new Set<string>();
  a.add(dexes.uniswapV2);
  b.add(dexes.sushiSwap);
  c.add(dexes.pancakeSwap);
  d.add(dexes.uniswapV3);

  e.add(dexes.sushiSwap);
  e.add(dexes.pancakeSwap);
  e.add(dexes.uniswapV2);
  e.add(dexes.uniswapV3);

  let uni_v2_data = await boundFunction(a);
  let sushi_data = await boundFunction(b);
  let pancake_data = await boundFunction(c);
  let uni_v3_data = await boundFunction(d);
  let all_data = await boundFunction(e);

  let simulated_output: {
    [key in string]: {
      success: boolean;
      amt: number;
    };
  } = {
    uni_v2: {
      success: false,
      amt: 0,
    },
    sushi: {
      success: false,
      amt: 0,
    },
    pancake: {
      success: false,
      amt: 0,
    },
  };

  // if (!(typeof uni_v2_data === "string")) {
  //   let path = uni_v2_data.map((e) => e[0]);
  //   let sim_data = await Simulator.swapUniswapV2(
  //     await getMaxTokenHolder(path[0]),
  //     inAmt,
  //     path,
  //     0
  //   );
  //   console.log(sim_data);
  // }

  // let uni_v2_path =
  //   typeof uni_v2_data === "string" ? [] : uni_v2_data.map((e) => e[0]);
  // let sushi_path =
  //   typeof sushi_data === "string" ? [] : sushi_data.map((e) => e[0]);
  // let pancake_path =
  //   typeof pancake_data === "string" ? [] : pancake_data.map((e) => e[0]);
  // let all_path = typeof all_data === "string" ? [] : all_data.map((e) => e[0]);

  return {
    [dexes.uniswapV2]: uni_v2_data,
    [dexes.sushiSwap]: sushi_data,
    [dexes.pancakeSwap]: pancake_data,
    [dexes.uniswapV3]: uni_v3_data,
    [dexes.all]: all_data,
  };
}

async function main() {
  const amountString = "5_000_000_000_000_000_000_000".replace(/_/g, "");
  const res = await findPaths(
    "0x5eed99d066a8caf10f3e4327c1b3d8b673485eed",
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    BigInt(amountString)
  );
  console.log(res);
  // const path = Array.from(res) as string[];
  // Simulator.swapUniswapV2(
  //   "0xD6153F5af5679a75cC85D8974463545181f48772",
  //   amount,
  //   path,
  //   0
  // );
}

// main();
