import { Pair, PairPancakeSwap, PairSushiSwap, PairV3 } from "@prisma/client";
import { Result } from "ethers";
import { prepareCall } from "./data-fetcher/multicall";

/* --------------------------------- Utils ---------------------------------- */

// https://stackoverflow.com/questions/41285211/overriding-interface-property-type-defined-in-typescript-d-ts-file/55032655#55032655
type Modify<T, R> = Omit<T, keyof R> & R;

type ValueOf<T> = T[keyof T];

export type WithVersion<T> = T & { version: Dexes };

export type BigIntReserves<
  T extends { token0Reserve: string; token1Reserve: string }
> = Modify<
  T,
  {
    token0Reserve: bigint;
    token1Reserve: bigint;
  }
>;

/* -------------------------------- Services -------------------------------- */

export type Dexes = "Uniswap V2" | "SushiSwap" | "PancakeSwap" | "Uniswap V3";

export type ModifiedPairV2 = WithVersion<BigIntReserves<Pair>>;
export type ModifiedPairV3 = WithVersion<
  Modify<
    Pick<
      PairV3,
      | "address"
      | "fees"
      | "token0Address"
      | "token1Address"
      | "tick"
      | "token0Balance"
      | "token1Balance"
    >,
    { token0Balance: bigint; token1Balance: bigint }
  >
>;

export type UsableDexes =
  | WithVersion<BigIntReserves<Pair>>
  | WithVersion<BigIntReserves<PairSushiSwap>>
  | WithVersion<BigIntReserves<PairPancakeSwap>>
  | ModifiedPairV3;

export interface IntermediatePathMember {
  amount: bigint;
  poolAddress: string;
  fees: number;
}

export interface PathMember {
  address: string;
  amountOut: string;
  dex: Dexes;
  fees: number;
  poolAddress: string;
}

export type Aggregate3Response = { success: boolean; returnData: string };

export type decodeFunction = (
  result: Aggregate3Response,
  call: ReturnType<typeof prepareCall>
) => Result;

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

/* ------------------------------- Controller ------------------------------- */

export interface QuoteBody {
  tokenInAddress: string;
  tokenOutAddress: string;
  userFriendly: boolean;
  amount: string;
  chainId: number;
  hops?: number;
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

export interface QuotePathMember extends PathMember {
  name: string;
}

export interface QuoteResponse {
  tokenIn: QuoteInputToken;
  path: {
    [k in Dexes]: QuotePathMember[] | string;
  };
  tokenOut: QuoteOutputToken;
  uniswapUrl: string;
  sushiUrl: string;
}

export interface Call3 {
  target: string;
  allowFailure: boolean;
  callData: string;
}

export interface CallDataV3MultiSwap {
  path: string;
  recipient: string;
  deadline: number;
  amountIn: string;
  amountOutMinimum: number;
}
