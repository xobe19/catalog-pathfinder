import reserves_imp from "./reserves.json";

const reserves = reserves_imp as {
  [key in string]: {
    token1: string;
    token0: string;
    reserve0: string;
    reserve1: string;
  };
};


let graph: {
  [key in string]: [string, string][]
} = {};

for(let pairAddr in reserves) {
  if(!graph[reserves[pairAddr].token0]) graph[reserves[pairAddr].token0] = [];
  graph[reserves[pairAddr].token0].push([reserves[pairAddr].token1, pairAddr]);
  
  if(!graph[reserves[pairAddr].token1]) graph[reserves[pairAddr].token1] = [];
  graph[reserves[pairAddr].token1].push([reserves[pairAddr].token0, pairAddr]);
}





let maxOut: {
  [key in string]: bigint;
} = {};

let prev: {
  [key in string]: string;
} = {};

function getOut(
  pairAddr: string,
  inTokenAddress: string,
  outTokenAddress: string,
  inTokenAmt: bigint
) {
  let in_token_res = BigInt(reserves[pairAddr].reserve1);
  let out_token_res = BigInt(reserves[pairAddr].reserve0);
  if (reserves[pairAddr].token1 != inTokenAddress) {
    let tmp = in_token_res;
    in_token_res = out_token_res;
    out_token_res = tmp;
  }

  let qty_token1_recieve = null;
  let st = BigInt(1),
    en = out_token_res;
  while (st <= en) {
    let mid = (st + en) / BigInt(2);
    let condition =
      inTokenAmt < in_token_res &&
      ((inTokenAmt + in_token_res) * BigInt(1000) -
        inTokenAmt * BigInt(3)) *
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

type QueueElement = {addr: string, path: Set<string>, qty: bigint};
function findPath(
  inTokenAddress: string,
  outTokenAddress: string,
  inAmt: bigint
) {

  let q: {
    [key in string]: {
      path: Set<String>,
      qty: bigint;
    }
  } = {};
 
  q[inTokenAddress] = {
    path: new Set(),
    qty: inAmt
  }
  q[inTokenAddress].path.add(inTokenAddress);
 
  let HOPS = 5;

  while(HOPS-->0) {
    let nq: {
    [key in string]: {
      path: Set<String>,
      qty: bigint;
    }
  }= {};

  for(let addr in q) {
    nq[addr] = {
      path: new Set(q[addr].path),
      qty: q[addr].qty
    }
  }
    for(let addr in q) {
      let qd = q[addr];
      for(let [neighbour, pa] of graph[addr]) {
         
        if(qd.path.has(neighbour)) continue;
        let new_qty = getOut(pa, addr, neighbour, qd.qty);
        if(!new_qty) continue;
        if(nq[neighbour] === undefined || nq[neighbour].qty < new_qty) {
          let new_path = new Set(qd.path);
          new_path.add(neighbour);
          nq[neighbour] = {path: new_path, qty: new_qty}
        }
      }
    }
    q = nq;
  }

  return q[outTokenAddress].path;

}

// vlink and usdc

console.log(findPath(
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  BigInt(10000)
));
// console.log(inPath["0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"]);
// let curr = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
// while (curr != "") {
//   console.log(curr);
//   let prv = prev[curr];
//   curr = prv;
// }
