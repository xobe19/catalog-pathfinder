"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniswapV2FactoryContract = exports.test_provider = exports.provider = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
const abis_1 = require("./data-fetcher/abis");
const constants_1 = require("./constants");
dotenv_1.default.config();
const ANKR_URL = process.env.MAINNET_RPC_URL;
if (!ANKR_URL)
    throw new Error("Please set the MAINNET_RPC_URL environment variable.");
exports.provider = new ethers_1.JsonRpcProvider(ANKR_URL);
exports.test_provider = new ethers_1.JsonRpcProvider(constants_1.GOERLI_ETH_URL);
exports.uniswapV2FactoryContract = new ethers_1.Contract(constants_1.UniswapV2Factory_ADDRESS, abis_1.uniswapV2FactoryABI, exports.provider);
