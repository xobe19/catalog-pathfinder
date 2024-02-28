export interface PairToken {
  address: string;
  quantity: string;
  decimal: number;
  symbol: string;
}

export interface Pair {
  address: string;
  token0: PairToken;
  token1: PairToken;
}

export interface Resolver {
  target: string;
  allowFailure: boolean;
  callData: string;
}
