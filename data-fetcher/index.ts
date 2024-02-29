import dotenv from "dotenv";
import { Contract, Interface, JsonRpcProvider } from "ethers";
import { MULTICALL_ABI_ETHERS, MULTICALL_ADDRESS } from "./constants";
import { PairToken, Resolver } from "./types";
dotenv.config();

// Setup the provider
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL;
if (!MAINNET_RPC_URL)
  throw new Error("Please set the MAINNET_RPC_URL environment variable.");
const provider = new JsonRpcProvider(MAINNET_RPC_URL);

// Get Multicall contract instance.
const multicall = new Contract(
  MULTICALL_ADDRESS,
  MULTICALL_ABI_ETHERS,
  provider
);

export function prepareCall(
  contractAddress: string,
  functionName: string,
  interfaceAbi: string,
  args?: any[]
) {
  const functionInterface = new Interface([interfaceAbi]);
  const resolver: Resolver = {
    target: contractAddress,
    allowFailure: true,
    callData: functionInterface.encodeFunctionData(functionName, args),
  };
  const decodeResult = (resolverResult: string) => {
    return functionInterface.decodeFunctionResult(functionName, resolverResult);
  };

  return {
    functionInterface,
    resolver,
    decodeResult,
  };
}

export async function executeCalls(calls: ReturnType<typeof prepareCall>[]) {
  const resolverCalls = calls.map((call) => call.resolver);

  type Aggregate3Response = { success: boolean; returnData: string };

  const resolverResults: Aggregate3Response[] =
    await multicall.aggregate3.staticCall(resolverCalls);
  return resolverResults.map((resolverResult, i) =>
    calls[i].decodeResult(resolverResult.returnData)
  );
}

async function getTokenDetails(tokenAddress: string): Promise<PairToken> {
  /* TODO: get from cache */
  return {
    address: tokenAddress,
    decimal: -1,
    quantity: BigInt(-1),
    symbol: "-1",
  };
}

async function getPairTokenDetails(
  token0Address: string,
  token1Address: string
) {
  const calls = [
    /* Token 0 -------------------------------------------------------------- */
    prepareCall(
      token0Address,
      "decimals",
      "function decimals() public constant returns (uint8 decimals)"
    ),
    prepareCall(
      token0Address,
      "symbol",
      "function symbol() public constant returns (string symbol)"
    ),
    prepareCall(
      token0Address,
      "name",
      "function name() external pure returns (string memory)"
    ),
    /* Token 1 -------------------------------------------------------------- */
    prepareCall(
      token1Address,
      "decimals",
      "function decimals() public constant returns (uint8 decimals)"
    ),
    prepareCall(
      token1Address,
      "symbol",
      "function symbol() public constant returns (string symbol)"
    ),
    prepareCall(
      token1Address,
      "name",
      "function name() external pure returns (string memory)"
    ),
  ];

  const [
    token0Decimals,
    token0Symbol,
    token0Name,
    token1Decimals,
    token1Symbol,
    token1Name,
  ] = await executeCalls(calls);
  return {
    token0: {
      decimal: token0Decimals[0],
      symbol: token0Symbol[0],
      name: token0Name[0],
    },
    token1: {
      decimal: token1Decimals[0],
      symbol: token1Symbol[0],
      name: token1Name[0],
    },
  };
}

async function getPairDetails(pairAddress: string) {
  const calls = [
    prepareCall(
      pairAddress,
      "getReserves",
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
    ),
    prepareCall(
      pairAddress,
      "token0",
      "function token0() external view returns (address)"
    ),
    prepareCall(
      pairAddress,
      "token1",
      "function token1() external view returns (address)"
    ),
  ];

  const [reserves, token0, token1] = await executeCalls(calls);

  const token0Address = token0[0];
  const token1Address = token1[0];
  // const tokenDetails = await getPairTokenDetails(token0Address, token1Address);

  const ret = {
    address: pairAddress,
    token0: {
      quantity: reserves[0],
      address: token0Address,
      // ...tokenDetails.token0,
    },
    token1: {
      address: token1Address,
      quantity: reserves[1],
      // ...tokenDetails.token1,
    },
  };
  return ret;
}

async function main() {
  const address = "0x3fd4Cf9303c4BC9E13772618828712C8EaC7Dd2F";
  try {
    const pair = await getPairDetails(address);
    console.log(pair);
  } catch (ex) {
    const err = ex as Error;
    console.error(new Error(`pair ${address}: ${err}`));
  }
}
