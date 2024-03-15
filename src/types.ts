import { Pair, PairPancakeSwap, PairSushiSwap, PairV3 } from "@prisma/client";
import { Result } from "ethers";
import { prepareCall } from "./data-fetcher/multicall";
import { dexes } from "./services/find_path";

// https://stackoverflow.com/questions/41285211/overriding-interface-property-type-defined-in-typescript-d-ts-file/55032655#55032655
type Modify<T, R> = Omit<T, keyof R> & R;

export type Aggregate3Response = { success: boolean; returnData: string };
export type decodeFunction = (
  result: Aggregate3Response,
  call: ReturnType<typeof prepareCall>
) => Result;

export interface QuoteBody {
  tokenInAddress: string;
  tokenOutAddress: string;
  userFriendly: boolean;
  amount: string;
}

export interface QuoteInputToken {
  address: string;
  amount: string;
  name: string;
}

export interface QuoteOutputToken {
  address: string;
  name: string;
}

export type ValueOf<T> = T[keyof T];

export interface QuotePathMember {
  address: string;
  amountOut: string;
  name: string;
  dex: ValueOf<typeof dexes>;
}

export interface QuoteResponse {
  tokenIn: QuoteInputToken;
  path: {
    [k in ValueOf<typeof dexes>]: QuotePathMember[] | string;
  };
  tokenOut: QuoteOutputToken;
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

export type PairV3BigInt = Pick<
  PairV3,
  "address" | "fees" | "token0Address" | "token1Address" | "tick"
> & {
  version: "Uniswap V3";
};

export type SushiPairBigInt = Modify<
  PairSushiSwap,
  {
    token0Reserve: bigint;
    token1Reserve: bigint;
  }
> & { version: "SushiSwap" };

export type PancakeSwapPairBigInt = Modify<
  PairPancakeSwap,
  {
    token0Reserve: bigint;
    token1Reserve: bigint;
  }
> & { version: "PancakeSwap" };

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
