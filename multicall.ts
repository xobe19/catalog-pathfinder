import dotenv from "dotenv";
import { Contract, Interface, JsonRpcProvider } from "ethers";
import { MULTICALL_ABI_ETHERS, MULTICALL_ADDRESS } from "./constants";
import { Call3 } from "./types";
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
  interfaceAbi: string,
  args?: any[]
) {
  const functionInterface = new Interface([interfaceAbi]);
  const call: Call3 = {
    target: contractAddress,
    allowFailure: true,
    callData: functionInterface.encodeFunctionData(functionName, args),
  };
  const decodeResult = (result: string) => {
    return functionInterface.decodeFunctionResult(functionName, result);
  };

  return {
    functionInterface,
    call,
    decodeResult,
  };
}

export async function executeCalls(calls: ReturnType<typeof prepareCall>[]) {
  const call3s = calls.map((call) => call.call);

  type Aggregate3Response = { success: boolean; returnData: string };

  const results: Aggregate3Response[] = await multicall.aggregate3.staticCall(
    call3s
  );
  return results.map((resolverResult, i) =>
    calls[i].decodeResult(resolverResult.returnData)
  );
}
