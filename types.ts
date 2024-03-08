import { Pair, PairV3 } from "@prisma/client";
import * as Mathjs from "mathjs";

// https://stackoverflow.com/questions/41285211/overriding-interface-property-type-defined-in-typescript-d-ts-file/55032655#55032655
type Modify<T, R> = Omit<T, keyof R> & R;

export interface Call3 {
  target: string;
  allowFailure: boolean;
  callData: string;
}

export type PairBigInt = Modify<
  Pair,
  {
    token0Reserve: bigint;
    token1Reserve: bigint;
  }
> & { version: 2 };

export type PairV3BigInt = Modify<
  PairV3,
  {
    liquidity: Mathjs.BigNumber;
    sqrtPriceX96: Mathjs.BigNumber;
  }
> & { version: 3 };

export type swapExactTokensForTokensArgs = {
  amountIn: bigint;
  amountOutMin: number;
  path: string[];
  to: string;
  deadline: number;
};

export type transactionObj = {
  to: string;
  data: string;
  from: string;
};

export type tenderlyTxObj = {
  from: string;
  to: string;
  input: string;
};
