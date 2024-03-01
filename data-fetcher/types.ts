export interface Token {
  address: string;
  name?: string;
}

export interface PairToken extends Token {
  quantity: BigInt;
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

export interface TokenDetailsReponse {
  decimal: number;
  symbol: string;
}
