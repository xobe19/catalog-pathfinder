      import reserves_imp from "./reserves.json";

const reserves = reserves_imp as {
  [key in string]: {
    token1: string;
    token0: string;
    reserve0: string;
    reserve1: string;
  };
};
let pairAddr = "0x52EBF91D06304e5CD64a140cec9a22EDb3e15D66";
  let maxOut: {
    [key in string]: bigint;
  } = {};
  let prev: {
    [key in string]: string;
  } = {};


      const token1_addr = reserves[pairAddr].token1;
      const token0_addr = reserves[pairAddr].token0;
      const res_token1 = BigInt(reserves[pairAddr].reserve1);
      const res_token0 = BigInt(reserves[pairAddr].reserve0);

      

        let qty_token0_toSwap = BigInt(10000); 
        let qty_token1_recieve = null;
        let st = BigInt(1), en = res_token1;
        while(st <= en) {
          let mid = (st + en)/BigInt(2);
          console.log(mid);
          let condition = qty_token0_toSwap < res_token0 && (((qty_token0_toSwap+res_token0)*BigInt(1000) - qty_token0_toSwap*BigInt(3))*((res_token1 - mid)*BigInt(1000)) >= res_token0*res_token1*BigInt(1000000))
          if(condition) {
            qty_token1_recieve = mid;

            st = mid + BigInt(1);
          }
          else {
            
            en = mid - BigInt(1);
          }
          
        }

        console.log(qty_token1_recieve)
        
        

      