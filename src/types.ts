import { Pair, PairPancakeSwap, PairSushiSwap } from "@prisma/client";

// https://stackoverflow.com/questions/41285211/overriding-interface-property-type-defined-in-typescript-d-ts-file/55032655#55032655
type Modify<T, R> = Omit<T, keyof R> & R;

export interface QuoteBody {
  tokenInAddress: string;
  tokenOutAddress: string;
  amount: string;
}

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
> & { version: "Uniswap V2" };

export type SushiPairBigInt = Modify<
  PairSushiSwap,
  {
    token0Reserve: bigint;
    token1Reserve: bigint;
  }
> & { version: "Sushi Swap" };

export type PancakeSwapPairBigInt = Modify<
  PairPancakeSwap,
  {
    token0Reserve: bigint;
    token1Reserve: bigint;
  }
> & { version: "Pancake Swap" };

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
