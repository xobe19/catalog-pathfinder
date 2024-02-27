import reserves_imp from "./reserves.json";

const reserves = reserves_imp as {
  [key in string]: {
    token1: string;
    token0: string;
    reserve0: string;
    reserve1: string;
  };
};
function findPath(
  inTokenAddress: string,
  outTokenAddress: string,
  inAmt: bigint
) {
  let maxOut: {
    [key in string]: bigint;
  } = {};

  let prev: {
    [key in string]: string;
  } = {};

  maxOut[inTokenAddress] = inAmt;
  prev[inTokenAddress] = "";
  let bellman_ford = 1000;
  while (bellman_ford-- > 0) {
    for (let pairAddr in reserves) {
      //token 0 to token 1

      const token1_addr = reserves[pairAddr].token1;
      const token0_addr = reserves[pairAddr].token0;
      const res_token1 = BigInt(reserves[pairAddr].reserve1);
      const res_token0 = BigInt(reserves[pairAddr].reserve0);

      if (maxOut[token0_addr] !== undefined) {
        let qty_token0 = maxOut[reserves[pairAddr].token0];
        let prod = res_token0 * res_token1;
        let qty_token1 = res_token1 - prod / (res_token0 + qty_token0);
        if (
          maxOut[token1_addr] === undefined ||
          maxOut[token1_addr] < qty_token1
        ) {
          maxOut[token1_addr] = qty_token1;
          prev[token1_addr] = token0_addr;
        }
      }

      //token 1 to token 0

      if (maxOut[token1_addr] !== undefined) {
        let qty_token1 = maxOut[token1_addr];
        let prod = res_token0 * res_token1;
        let qty_token0 = res_token0 - prod / (res_token1 + qty_token1);
        if (
          (maxOut[token0_addr] === undefined ||
            maxOut[token0_addr] < qty_token0) &&
          prev[token1_addr] != token0_addr 
        ) {
          maxOut[token0_addr] = qty_token0;
          prev[token0_addr] = token1_addr;
        }
      }
    }
    return prev;
  }
}

// vlink and usdc

let prev = findPath(
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  BigInt(10000)
);
let curr = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
while (curr != "") {
  console.log(curr);
  curr = prev![curr];
}
