import dotenv from "dotenv";
import { Contract, JsonRpcProvider, ethers } from "ethers";
import { uniswapV2FactoryABI } from "./data-fetcher/abis";
import {
  GOERLI_ETH_URL,
  UniswapQuoter_ABI,
  UniswapV2Factory_ADDRESS,
  UniswapV3Quoter_ADDRESS,
} from "./constants";
dotenv.config();

const ANKR_URL = process.env.MAINNET_RPC_URL;
if (!ANKR_URL)
  throw new Error("Please set the MAINNET_RPC_URL environment variable.");

export const provider = new JsonRpcProvider(ANKR_URL);
export const test_provider = new JsonRpcProvider(GOERLI_ETH_URL);

export const uniswapV2FactoryContract = new Contract(
  UniswapV2Factory_ADDRESS,
  uniswapV2FactoryABI,
  provider
);

export const Quotercontract = new ethers.Contract(
  UniswapV3Quoter_ADDRESS,
  UniswapQuoter_ABI,
  provider
);
