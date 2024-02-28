import dotenv from "dotenv";
import { Contract, Interface, JsonRpcProvider, namehash } from "ethers";
import { MULTICALL_ABI_ETHERS, MULTICALL_ADDRESS } from "./constants";
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

function prepareCall(
  contractAddress: string,
  functionName: string,
  interfaceAbi: string
) {
  const functionInterface = new Interface([interfaceAbi]);
  const resolver = {
    target: contractAddress,
    allowFailure: true,
    callData: functionInterface.encodeFunctionData(functionName),
  };
  const decodeResult = (resolverResult: any) => {
    return functionInterface.decodeFunctionResult(functionName, resolverResult);
  };

  return {
    functionInterface,
    resolver,
    decodeResult,
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
  const resolverCalls = calls.map((call) => call.resolver);

  type Aggregate3Response = { success: boolean; returnData: string };
  const resolverResults: Aggregate3Response[] =
    await multicall.aggregate3.staticCall(resolverCalls);

  for (let i = 0; i < calls.length; i++) {
    const resolverResult = resolverResults[i];
    const result = calls[i].decodeResult(resolverResult.returnData);
    console.log(result);
  }
}

getPairDetails("0x3fd4Cf9303c4BC9E13772618828712C8EaC7Dd2F");
