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
    }
    return maxOut[outTokenAddress];
  }
}

// vlink and usdc
console.log(
  findPath(
    "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    BigInt(10000)
  )
);
