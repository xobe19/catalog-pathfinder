import dotenv from "dotenv";
import { Contract, JsonRpcProvider, ethers } from "ethers";
import { CONTRACT, GOERLI_ETH_URL, UniswapV3Quoter_ADDRESS } from "./constants";
import { UniswapQuoter_ABI, uniswapV2FactoryABI } from "./data-fetcher/abis";
import processEnvSafe from "./safeEnv";

dotenv.config();

const ANKR_URL = processEnvSafe("MAINNET_RPC_URL");
export const provider = new JsonRpcProvider(ANKR_URL);
export const test_provider = new JsonRpcProvider(GOERLI_ETH_URL);

export const uniswapV2FactoryContract = new Contract(
  CONTRACT.ETHEREUM.UNISWAP_V2,
  uniswapV2FactoryABI,
  provider
);

export const Quotercontract = new ethers.Contract(
  UniswapV3Quoter_ADDRESS,
  UniswapQuoter_ABI,
  provider
);
