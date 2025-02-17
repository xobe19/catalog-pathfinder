import tokensJson from "../../data/default_uniswap.json";
import {
  Dexes,
  IntermediatePathMember,
  ModifiedPairV2,
  ModifiedPairV3,
  PathMember,
  UsableDexes,
} from "../types";
import { prisma } from "./dbClient";
import { getQuoteV3 } from "./getQuoteV3";

function disp(
  addr: Set<String>,
  intermediate_path: Set<IntermediatePathMember>,
  token_from_pool: Array<Dexes>
) {
  let len = addr.size;
  let itr_1 = addr.values();
  let itr_2 = intermediate_path.values();

  const ret: PathMember[] = [];
  for (let i = 0; i < len; i++) {
    const it2val = itr_2.next().value;
    ret.push({
      address: itr_1.next().value.toLowerCase(),
      amountOut: it2val.amount.toString(),
      dex: token_from_pool[i],
      fees: it2val.fees,
      poolAddress: it2val.poolAddress,
    });
  }
  return ret.slice(1);
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

async function getReservesFromDb(chainId: number): Promise<UsableDexes[]> {
  const v2Pairs = await prisma.pair.findMany({ where: { chainId } });
  const sushiPairs = await prisma.pairSushiSwap.findMany({
    where: { chainId },
  });
  const pancakePairs = await prisma.pairPancakeSwap.findMany({
    where: { chainId },
  });
  const uniswapV3Pairs = await prisma.pairV3.findMany({ where: { chainId } });

  const toRet: UsableDexes[] = [];

  [
    { name: "Uniswap V2" as const, pair: v2Pairs },
    { name: "SushiSwap" as const, pair: sushiPairs },
    { name: "PancakeSwap" as const, pair: pancakePairs },
  ].forEach((ele) => {
    ele.pair.forEach((e) =>
      toRet.push({
        address: e.address.toLowerCase(),
        token0Address: e.token0Address.toLowerCase(),
        token0Reserve: BigInt(e.token0Reserve).valueOf(),
        token1Address: e.token1Address.toLowerCase(),
        token1Reserve: BigInt(e.token1Reserve).valueOf(),
        version: ele.name,
        chainId,
      })
    );
  });

  uniswapV3Pairs.forEach((e) =>
    toRet.push({
      address: e.address.toLowerCase(),
      token0Address: e.token0Address.toLowerCase(),
      token1Address: e.token1Address.toLowerCase(),
      tick: e.tick,
      fees: e.fees,
      version: "Uniswap V3",
      token0Balance: BigInt(e.token0Balance),
      token1Balance: BigInt(e.token1Balance),
    })
  );

  return toRet;
}

function getOutV2(
  in_token_res: bigint,
  out_token_res: bigint,
  inTokenAmt: bigint
) {
  let qty_token1_receive = null;
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
      qty_token1_receive = mid;

      st = mid + BigInt(1);
    } else {
      en = mid - BigInt(1);
    }
  }
  return qty_token1_receive;
}

export async function findPath(
  inTokenAddress: string,
  outTokenAddress: string,
  inAmt: bigint,
  graph: {
    [key in string]: [string, UsableDexes][];
  },
  safeTokens: Set<string>,
  chainId: number,
  hops: number = 3,
  dexes: Set<Dexes>
): Promise<string | PathMember[]> {
  // console.log(graph[data.gooch.address]);

  let queue: {
    [key in string]: {
      path: Set<String>;
      qty: bigint;
      intermediate_path: Set<IntermediatePathMember>;
      token_from_pool: Array<Dexes>;
    };
  } = {};

  queue[inTokenAddress] = {
    path: new Set(),
    qty: inAmt,
    intermediate_path: new Set(),
    token_from_pool: new Array(),
  };
  queue[inTokenAddress].path.add(inTokenAddress);
  queue[inTokenAddress].intermediate_path.add({
    amount: inAmt,
    poolAddress: "",
    fees: 0,
  });
  queue[inTokenAddress].token_from_pool.push("-" as Dexes);

  let HOPS = hops;

  while (HOPS-- > 0) {
    let new_queue: {
      [key in string]: {
        path: Set<String>;
        qty: bigint;
        intermediate_path: Set<IntermediatePathMember>;
        token_from_pool: Array<Dexes>;
      };
    } = {};

    let pending_multicall = [];
    let pending_paths = [];
    let pending_intermediates = [];
    let pending_token_from_pool = [];
    let pending_pairs = [];

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
        if (!safeTokens.has(neighbour) && neighbour !== outTokenAddress)
          continue;

        let new_qty;
        if (p.version !== "Uniswap V3") {
          const typedP = p as ModifiedPairV2;
          let q1 = typedP.token0Reserve;
          let q2 = typedP.token1Reserve;
          if (typedP.token0Address != addr) {
            let tmp = q2;
            q2 = q1;
            q1 = tmp;
          }
          new_qty = getOutV2(q1.valueOf(), q2.valueOf(), qd.qty);
        } else {
          const typedP = p as ModifiedPairV3;
          pending_multicall.push({
            fees: typedP.fees,
            out: neighbour,
            in: addr,
            qty: qd.qty.toString(),
          });
          pending_paths.push(qd.path);
          pending_intermediates.push(qd.intermediate_path);
          pending_token_from_pool.push(qd.token_from_pool);
          pending_pairs.push(p);
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
          new_intermediate_path.add({
            amount: new_qty,
            poolAddress: p.address,
            fees:
              p.version !== "Uniswap V3" ? 3000 : (p as ModifiedPairV3).fees,
          });
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

    let new_quantities = await getQuoteV3(pending_multicall, chainId);

    for (let i = 0; i < new_quantities.length; i++) {
      let new_qty = new_quantities[i];
      let neighbour = pending_multicall[i].out;
      if (!new_qty) continue;
      if (
        new_queue[neighbour] === undefined ||
        new_queue[neighbour].qty < new_qty
      ) {
        let new_path = new Set(pending_paths[i]);
        let new_intermediate_path = new Set(pending_intermediates[i]);
        let new_token_from_pool = [...pending_token_from_pool[i]];
        let p = pending_pairs[i];
        new_path.add(neighbour);
        new_intermediate_path.add({
          amount: new_qty,
          poolAddress: p.address,
          fees: p.version !== "Uniswap V3" ? 3000 : (p as ModifiedPairV3).fees,
        });

        new_token_from_pool.push(p.version);

        new_queue[neighbour] = {
          path: new_path,
          qty: new_qty,
          intermediate_path: new_intermediate_path,
          token_from_pool: new_token_from_pool,
        };
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
  inAmt: bigint,
  chainId: number,
  hops?: number
): Promise<{
  [k in Dexes]: string | PathMember[];
}> {
  const graph: {
    [key in string]: [string, UsableDexes][];
  } = {};

  const reserves = await getReservesFromDb(chainId);

  console.log(`fetched ${reserves.length} rows from db`);

  for (let pair of reserves) {
    let token0 = pair.token0Address;
    let token1 = pair.token1Address;
    if (!graph[token0]) graph[token0] = [];
    graph[token0].push([token1, pair]);
    if (!graph[token1]) graph[token1] = [];
    graph[token1].push([token0, pair]);
  }

  const safeTokens = new Set<string>(
    tokensJson["tokens"]
      .filter((e) => e.chainId === chainId)
      .map((e) => e.address.toLowerCase())
  );

  let boundFunction = findPath.bind(
    null,
    inTokenAddress,
    outTokenAddress,
    inAmt,
    graph,
    safeTokens,
    chainId,
    hops
  );
  let a = new Set<Dexes>();
  let b = new Set<Dexes>();
  let c = new Set<Dexes>();
  let d = new Set<Dexes>();
  let e = new Set<Dexes>();
  a.add("Uniswap V2");
  b.add("SushiSwap");
  c.add("PancakeSwap");
  d.add("Uniswap V3");

  // e.add("SushiSwap");
  // e.add("PancakeSwap");
  // e.add("Uniswap V2");
  // e.add("Uniswap V3");

  let uni_v2_data = await boundFunction(a);
  let sushi_data = await boundFunction(b);
  let pancake_data = await boundFunction(c);
  let uni_v3_data = await boundFunction(d);
  // let all_data = await boundFunction(e);

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
    "Uniswap V2": uni_v2_data,
    SushiSwap: sushi_data,
    PancakeSwap: pancake_data,
    "Uniswap V3": uni_v3_data,
  };
}

// (async function () {
//   console.log(
//     await findPaths(
//       "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
//       "0x5eed99d066a8caf10f3e4327c1b3d8b673485eed",
//       BigInt("4000000000")
//     )
//   );
// })();
