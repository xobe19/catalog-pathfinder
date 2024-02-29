import dotenv from "dotenv";
import { Contract, Interface, JsonRpcProvider } from "ethers";
import { MULTICALL_ABI_ETHERS, MULTICALL_ADDRESS } from "./constants";
import { Pair, Resolver } from "./types";
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
  args: any[]
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

// async function main() {
//   const contractAddress = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

//   const calls = [];
//   for (let i = 0; i < 1000; i++) {
//     calls.push(
//       prepareCall(
//         contractAddress,
//         "allPairs",
//         "function allPairs(uint) external view returns (address pair)",
//         [BigInt(i)]
//       )
//     );
//   }
//   const result = await executeCalls(calls);
//   console.log(result);
// }

// main();
