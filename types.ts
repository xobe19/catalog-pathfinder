import { Pair } from "@prisma/client";

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
>;

export type swapExactTokensForTokensArgs = {
  amountIn: bigint;
  amountOutMin: number;
  path: string[];
  to: string;
  deadline: number;
};
