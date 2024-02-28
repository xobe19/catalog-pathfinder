

const reserves = {"0x52EBF91D06304e5CD64a140cec9a22EDb3e15D66": {
  "token0": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  "token1": "0x78a685E0762096ed0F98107212e98F8C35A9D1D8",
  "reserve0": "46111",
  "reserve1": "32905758622612"
}} as {
  [key in string]: {
    token1: string;
    token0: string;
    reserve0: string;
    reserve1: string;
  };
};
  let maxOut: {
    [key in string]: bigint;
  } = {};

  let prev: {
    [key in string]: string;
  } = {};
function findPath(
  inTokenAddress: string,
  outTokenAddress: string,
  inAmt: bigint
) {


  maxOut[inTokenAddress] = inAmt;
  prev[inTokenAddress] = "";
  let bellman_ford = 1000;
  while (bellman_ford-- > 0) {
  //  console.log(bellman_ford);
    for (let pairAddr in reserves) {

      
      //token 0 to token 1

      const token1_addr = reserves[pairAddr].token1;
      const token0_addr = reserves[pairAddr].token0;
      let res_token1 = BigInt(reserves[pairAddr].reserve1);
      let res_token0 = BigInt(reserves[pairAddr].reserve0);

      

      if (maxOut[token0_addr] !== undefined) {
        let qty_token0_toSwap = maxOut[token0_addr]; 
        let qty_token1_recieve = null;
        let st = BigInt(1), en = res_token1;
        while(st <= en) {
          let mid = (st + en)/BigInt(2);
          let condition = qty_token0_toSwap < res_token0 && (((qty_token0_toSwap+res_token0)*BigInt(1000) - qty_token0_toSwap*BigInt(3))*((res_token1 - mid)*BigInt(1000)) >= res_token0*res_token1*BigInt(1000000))
          if(condition) {
            qty_token1_recieve = mid;

            st = mid + BigInt(1);
          }
          else {

            en = mid - BigInt(1);
          }
          
        }
        
        if(qty_token1_recieve && (maxOut[token1_addr] === undefined || maxOut[token1_addr] < qty_token1_recieve)) {
          reserves[pairAddr].reserve0 = (res_token0 + qty_token0_toSwap).toString(); 
          reserves[pairAddr].reserve1 = (res_token1 - qty_token1_recieve).toString();
          maxOut[token1_addr] = qty_token1_recieve;
          prev[token1_addr] = token0_addr;
          
        }
      }

       res_token1 = BigInt(reserves[pairAddr].reserve1);
       res_token0 = BigInt(reserves[pairAddr].reserve0);

      //token 1 to token 0
if (maxOut[token1_addr] !== undefined) {
        let qty_token1_toSwap = maxOut[token1_addr]; 
        let qty_token0_recieve = null;
        let st = BigInt(1), en = res_token0;
        while(st <= en) {
          let mid = (st + en)/BigInt(2);

          console.log(mid);
          console.log(qty_token1_toSwap < res_token1)
          let condition = (qty_token1_toSwap < res_token1) && (
            (
              (
                (qty_token1_toSwap+res_token1)*BigInt(1000) - qty_token1_toSwap*BigInt(3)
                )
                *
                (
                  (res_token0 - mid)*BigInt(1000)
                  )
                  ) >= (res_token0*res_token1*BigInt(1000000))
                  )
          if(condition) {
            qty_token0_recieve = mid;

            st = mid + BigInt(1);
          }
          else {

            en = mid - BigInt(1);
          }
          
        }
        if(qty_token0_recieve && (maxOut[token0_addr] === undefined || maxOut[token0_addr] < qty_token0_recieve)){
          reserves[pairAddr].reserve1 = (res_token1 + qty_token1_toSwap).toString(); 
          reserves[pairAddr].reserve0 = (res_token0 - qty_token0_recieve).toString();
          maxOut[token0_addr] = qty_token0_recieve;
          prev[token0_addr] = token1_addr;
        }
      }
      
    }
  }
}

// vlink and usdc

 findPath(

  "0x78a685E0762096ed0F98107212e98F8C35A9D1D8",
  "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  BigInt("10000000000")
);

console.log("hii");
for(let key in prev) {
  if(prev[key] === "0xdAC17F958D2ee523a2206206994597C13D831ec7") console.log(key);
}
console.log("hii");
let curr = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
while (curr != "") {
  console.log(curr, maxOut[curr]);
  curr = prev![curr];
}
