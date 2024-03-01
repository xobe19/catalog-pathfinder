import { Pair, PairToken as PairTokenT } from "./data-fetcher/types";
import reserves_imp from "./top_pairs.json";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function getReservesFromDb(): Promise<Pair[]> {
  const t = await prisma.pair.findMany({
    include: {
      tokens: true,
    },
  });
  //TODO: to implement

  return t.map((e) => {
    return { address: e.address, token0: {address: e.tokens?.token0Id!, quantity: e.token0Reserve!}, token1: {address: e.tokens?.token1Id!, quantity: e.token1Reserve!} };
  });
}

const gooch = "0x6d3d490964205c8bc8ded39e48e88e8fde45b41f";
const wbtc = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599";
const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const flx = "0x6243d8cea23066d098a15582d81a598b4e8391f4";
const wait = "0x2559813bbb508c4c79e9ccce4703bcb1f149edd7";
(async function() {
const reserves = await getReservesFromDb();

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

  let HOPS = 10;

  while (HOPS-- > 0) {
    console.log(q);
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
        let q1 = (p.token0.quantity);
        let q2 = (p.token1.quantity);
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

  return q[outTokenAddress].qty;
}

// vlink and usdc

console.log(
  findPath(flx, wait, BigInt("10000")  )
);
// console.log(inPath["0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"]);
// let curr = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
// while (curr != "") {
//   console.log(curr);
//   let prv = prev[curr];
//   curr = prv;
// }

})()