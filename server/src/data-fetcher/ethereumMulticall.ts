import { Contract, JsonRpcProvider } from "ethers";
import { MULTICALL_ADDRESS } from "../constants";
import processEnvSafe from "../safeEnv";
import { decodeFunction } from "../types";
import { MULTICALL_ABI_ETHERS } from "./abis";
import {
  executeCalls as executeCallsMC,
  prepareCall as prepareCallMC,
  prepareCallVariable as prepareCallVariableMC,
} from "./multicall";

// Setup the provider
const MAINNET_RPC_URL = processEnvSafe("MAINNET_RPC_URL");
const provider = new JsonRpcProvider(MAINNET_RPC_URL);

const multicall = new Contract(
  MULTICALL_ADDRESS,
  MULTICALL_ABI_ETHERS,
  provider
);

export async function executeCalls(
  calls: ReturnType<typeof prepareCall>[],
  decode?: decodeFunction
) {
  return executeCallsMC(multicall, calls, decode);
}

export const prepareCall = prepareCallMC;
export const prepareCallVariable = prepareCallVariableMC;
