import { Pair, PairToken as PairTokenT } from "./data-fetcher/types";
import reserves_imp from "./top_pairs.json";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

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
};

async function getReservesFromDb(): Promise<Pair[]> {
  const t = await prisma.pairMar1.findMany();
  const toRet = t.map((e) => ({
    address: e.address.toLowerCase(),
    token0: {
      address: e.token0Address.toLowerCase(),
      quantity: BigInt(e.token0Reserve).valueOf(),
    },
    token1: {
      address: e.token1Address.toLowerCase(),
      quantity: BigInt(e.token1Reserve).valueOf(),
    },
  }));
  return toRet;
}

(async function () {
  const reserves = await getReservesFromDb();
  console.log(`fetched ${reserves.length} rows from db`);

  let graph: {
    [key in string]: [string, Pair][];
  } = {};

  for (let pair of reserves) {
    let token0 = pair.token0.address;
    let token1 = pair.token1.address;
    if (!graph[token0]) graph[token0] = [];
    graph[token0].push([token1, pair]);
    if (!graph[token1]) graph[token1] = [];
    graph[token1].push([token0, pair]);
  }
  let maxOut: {
    [key in string]: bigint;
  } = {};

  let prev: {
    [key in string]: string;
  } = {};

  function getOut(
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

  let inPath: {
    [key in string]: Set<string>;
  } = {};

  type QueueElement = { addr: string; path: Set<string>; qty: bigint };
  function findPath(
    inTokenAddress: string,
    outTokenAddress: string,
    inAmt: bigint
  ) {
    let q: {
      [key in string]: {
        path: Set<String>;
        qty: bigint;
      };
    } = {};

    q[inTokenAddress] = {
      path: new Set(),
      qty: inAmt,
    };
    q[inTokenAddress].path.add(inTokenAddress);

    let HOPS = 2;

    while (HOPS-- > 0) {
      // console.log(q);
      let nq: {
        [key in string]: {
          path: Set<String>;
          qty: bigint;
        };
      } = {};

      for (let addr in q) {
        nq[addr] = {
          path: new Set(q[addr].path),
          qty: q[addr].qty,
        };
      }
      for (let addr in q) {
        let qd = q[addr];
        //  console.log("neighbours");
        for (let [neighbour, p] of graph[addr]) {
          //  console.log(neighbour);
          if (qd.path.has(neighbour)) continue;
          //   console.log(p.token0.quantity);
          //  console.log(p.token1.quantity);
          let q1 = p.token0.quantity;
          let q2 = p.token1.quantity;
          if (p.token0.address != addr) {
            let tmp = q2;
            q2 = q1;
            q1 = tmp;
          }
          let new_qty = getOut(q1.valueOf(), q2.valueOf(), qd.qty);

          if (!new_qty) continue;
          if (nq[neighbour] === undefined || nq[neighbour].qty < new_qty) {
            let new_path = new Set(qd.path);
            new_path.add(neighbour);
            nq[neighbour] = { path: new_path, qty: new_qty };
          }
        }
        //  console.log("neigh end");
      }
      q = nq;
    }

    console.log("Optimal path");
    console.log(q[outTokenAddress].path);
    return q[outTokenAddress].qty;
  }

  // vlink and usdc

  console.log(
    findPath(
      data.shibainu.address,
      data.usdc.address,
      BigInt("100000000000000000000000000")
    )
  );
  // console.log(inPath["0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"]);
  // let curr = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
  // while (curr != "") {
  //   console.log(curr);
  //   let prv = prev[curr];
  //   curr = prv;
  // }
})();
