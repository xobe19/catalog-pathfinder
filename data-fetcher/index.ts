import dotenv from "dotenv";
import { Contract, Interface, JsonRpcProvider } from "ethers";
import { MULTICALL_ABI_ETHERS, MULTICALL_ADDRESS } from "./constants";
import { Resolver } from "./types";
dotenv.config();

// Setup the provider
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL;
if (!MAINNET_RPC_URL)
  throw new Error("Please set the MAINNET_RPC_URL environment variable.");
const provider = new JsonRpcProvider(MAINNET_RPC_URL);

// Get Multicall contract instance.
export const multicall = new Contract(
  MULTICALL_ADDRESS,
  MULTICALL_ABI_ETHERS,
  provider
);

export function prepareCall(
  contractAddress: string,
  functionName: string,
  interfaceAbi: string
) {
  const functionInterface = new Interface([interfaceAbi]);
  const resolver: Resolver = {
    target: contractAddress,
    allowFailure: true,
    callData: functionInterface.encodeFunctionData(functionName),
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

async function executeCalls(calls: ReturnType<typeof prepareCall>[]) {
  const resolverCalls = calls.map((call) => call.resolver);

  type Aggregate3Response = { success: boolean; returnData: string };
  const resolverResults: Aggregate3Response[] =
    await multicall.aggregate3.staticCall(resolverCalls);

  return resolverResults.map((resolverResult, i) =>
    calls[i].decodeResult(resolverResult.returnData)
  );
}

export async function getTokenDetails(tokenA: string, tokenB: string) {
  const calls = [
    prepareCall(
      tokenA,
      "symbol",
      "function symbol() public constant returns (string symbol)"
    ),
    prepareCall(
      tokenA,
      "decimals",
      "function decimals() public constant returns (uint8 decimals)"
    ),
    prepareCall(
      tokenB,
      "symbol",
      "function symbol() public constant returns (string symbol)"
    ),
    prepareCall(
      tokenB,
      "decimals",
      "function decimals() public constant returns (uint8 decimals)"
    ),
  ];

  const [symbolA, decimalA, symbolB, deciamalB] = await executeCalls(calls);
  return [
    {
      decimal_A: Number(decimalA),
      symbol_A: symbolA,
    },
    {
      decimal_B: Number(deciamalB),
      symbol_B: symbolB,
    },
  ];
}

// export async function getPairDetails(pairAddress: string) {
//   const calls = [
//     prepareCall(
//       pairAddress,
//       "getReserves",
//       "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
//     ),
//     prepareCall(
//       pairAddress,
//       "token0",
//       "function token0() external view returns (address)"
//     ),
//     prepareCall(
//       pairAddress,
//       "token1",
//       "function token1() external view returns (address)"
//     ),
//   ];

//   const [reserves, token0, token1] = await executeCalls(calls);

//   const token0Address = token0[0];
//   const token1Address = token1[0];

//   const token0Details = await getTokenDetails(token0Address);
//   const token1Details = await getTokenDetails(token1Address);

//   const ret: Pair = {
//     address: pairAddress,
//     token0: {
//       address: token0Address,
//       quantity: reserves[0],
//       ...token0Details,
//     },
//     token1: {
//       address: token1Address,
//       quantity: reserves[1],
//       ...token1Details,
//     },
//   };
//   return ret;
// }

async function main() {
  // const pair = await getPairDetails(
  //   "0x3fd4Cf9303c4BC9E13772618828712C8EaC7Dd2F"
  // );

  const token = await getTokenDetails(
    "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C",
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  );

  console.log(token); // console.log(pair);
}

// main();
