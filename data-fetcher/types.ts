import { Pair } from "@prisma/client";

// https://stackoverflow.com/questions/41285211/overriding-interface-property-type-defined-in-typescript-d-ts-file/55032655#55032655
type Modify<T, R> = Omit<T, keyof R> & R;

export interface Resolver {
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
