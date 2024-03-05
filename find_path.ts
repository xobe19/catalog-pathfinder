import { PrismaClient } from "@prisma/client";
import { PairBigInt } from "./types";
import { parseUnits } from "ethers";
import { Simulator } from "./trade-simulator";

const prisma = new PrismaClient();

function disp(addr: Set<String>, intermediate_path: Set<bigint>) {
  let len = addr.size;
  console.log(len);
  let itr_1 = addr.values();
  let itr_2 = intermediate_path.values();
  console.log("Addr                                        Amt");
  for (let _ = 0; _ < len; _++) {
    console.log(`${itr_1.next().value} , ${itr_2.next().value.toString()}`);
  }
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
};

function formatDecimal(x: bigint, decimal: number) {
  let final_string = x.toString();
  let indx = final_string.length - decimal;
  final_string = final_string.slice(0, indx) + "." + final_string.slice(indx);
  return final_string;
}

async function getReservesFromDb(): Promise<PairBigInt[]> {
  const t = await prisma.pair.findMany();
  const toRet: PairBigInt[] = t.map((e) => ({
    address: e.address.toLowerCase(),
    token0Address: e.token0Address.toLowerCase(),
    token0Reserve: BigInt(e.token0Reserve).valueOf(),
    token1Address: e.token1Address.toLowerCase(),
    token1Reserve: BigInt(e.token1Reserve).valueOf(),
  }));
  return toRet;
}

(async function () {
  const reserves = await getReservesFromDb();
  console.log(`fetched ${reserves.length} rows from db`);

  let graph: {
    [key in string]: [string, PairBigInt][];
  } = {};

  for (let pair of reserves) {
    let token0 = pair.token0Address;
    let token1 = pair.token1Address;
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

  type QueueElement = {
    addr: string;
    path: Set<string>;
    qty: bigint;
    intermediate_path: Set<bigint>;
  };
  function findPath(
    inTokenAddress: string,
    outTokenAddress: string,
    inAmt: bigint
  ) {
    let q: {
      [key in string]: {
        path: Set<String>;
        qty: bigint;
        intermediate_path: Set<bigint>;
      };
    } = {};

    q[inTokenAddress] = {
      path: new Set(),
      qty: inAmt,
      intermediate_path: new Set(),
    };
    q[inTokenAddress].path.add(inTokenAddress);
    q[inTokenAddress].intermediate_path.add(inAmt);

    let HOPS = 10;

    while (HOPS-- > 0) {
      // console.log(q);
      let nq: {
        [key in string]: {
          path: Set<String>;
          qty: bigint;
          intermediate_path: Set<bigint>;
        };
      } = {};

      for (let addr in q) {
        nq[addr] = {
          path: new Set(q[addr].path),
          qty: q[addr].qty,
          intermediate_path: new Set(q[addr].intermediate_path),
        };
      }
      for (let addr in q) {
        let qd = q[addr];
        //  console.log("neighbours");
        for (let [neighbour, p] of graph[addr]) {
          //  console.log(neighbour);
          if (qd.path.has(neighbour)) continue;
          //   console.log(p.token0Reserve);
          //  console.log(p.token1Reserve);
          let q1 = p.token0Reserve;
          let q2 = p.token1Reserve;
          if (p.token0Address != addr) {
            let tmp = q2;
            q2 = q1;
            q1 = tmp;
          }
          let new_qty = getOut(q1.valueOf(), q2.valueOf(), qd.qty);

          if (!new_qty) continue;
          if (nq[neighbour] === undefined || nq[neighbour].qty < new_qty) {
            let new_path = new Set(qd.path);
            let new_intermediate_path = new Set(qd.intermediate_path);
            new_path.add(neighbour);
            new_intermediate_path.add(new_qty);
            nq[neighbour] = {
              path: new_path,
              qty: new_qty,
              intermediate_path: new_intermediate_path,
            };
          }
        }
        //  console.log("neigh end");
      }
      q = nq;
    }

    console.log("Optimal path");
    disp(q[outTokenAddress].path, q[outTokenAddress].intermediate_path);
    return q[outTokenAddress].path;
  }

  // vlink and usdc

  const amount = BigInt("6000000000000000000");
  const res = findPath(data.maker.address, data.wbtc.address, amount);
  const path = Array.from(res) as string[];
  Simulator.swapUniswapV2("", amount, path, 0);

  // console.log(inPath["0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"]);
  // let curr = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
  // while (curr != "") {
  //   console.log(curr);
  //   let prv = prev[curr];
  //   curr = prv;
  // }
})();
