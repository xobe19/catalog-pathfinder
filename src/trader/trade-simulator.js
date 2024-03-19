"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Simulator = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv = __importStar(require("dotenv"));
const constants_1 = require("../constants");
const calldataGenerator_1 = require("./calldataGenerator");
dotenv.config();
const TENDERLY_ACCESS_KEY = process.env.TENDERLY_API;
class Simulator {
}
exports.Simulator = Simulator;
_a = Simulator;
Simulator.executeBatch = async (transactions, path, block_number) => {
    try {
        const res = (await axios_1.default.post(`https://api.tenderly.co/api/v1/account/hiteshlwni/project/project/simulate-bundle`, {
            simulations: transactions.map((singleTx) => ({
                network_id: "1",
                save: true,
                save_if_fails: true,
                simulation_type: "full",
                block_number: block_number,
                ...singleTx,
            })),
        }, {
            headers: {
                "X-Access-Key": TENDERLY_ACCESS_KEY,
            },
        })).data;
        let stack_trace = res.simulation_results[1].transaction.transaction_info.stack_trace;
        let failedAt = "";
        for (let stkEle of stack_trace) {
            if (path.find((e) => e === stkEle.contract)) {
                failedAt = stkEle.contract;
                break;
            }
        }
        return {
            success: res.simulation_results[1].simulation.status,
            failedAt,
        };
        console.timeEnd("Batch Simulation");
    }
    catch (error) {
        console.log(error);
        return error;
    }
};
// ? approve amountIn token to UniswapV2Router from from_address && swapTokens
Simulator.swapUniswapV2 = async (from_address, amountIn, path, amountOutMin) => {
    console.log(from_address);
    // ? MKR -> WTBC
    const transactionData = calldataGenerator_1.CalldataGenerator.approveTokens(path[0], constants_1.UNISWAP_V2_ROUTER, amountIn, from_address);
    const swapCall = calldataGenerator_1.CalldataGenerator.swapTokens(amountIn, path, from_address, amountOutMin);
    const calls = [
        {
            from: transactionData?.txObj.from,
            to: transactionData?.txObj.to,
            input: transactionData?.calldata,
        },
        {
            from: swapCall?.txObj.from,
            to: swapCall?.txObj.to,
            input: swapCall?.calldata,
        },
    ];
    return await _a.executeBatch(calls, path);
};
Simulator.test = async () => {
    // ? MKR -> WTBC
    const whale = "0xe2b03ed9a9213fe82413ca9338856433acc5a853";
    const amount = BigInt(4000000000000000000);
    const mkr = "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2";
    const transactionData = calldataGenerator_1.CalldataGenerator.approveTokens(mkr, constants_1.UNISWAP_V2_ROUTER, amount, whale);
    const path = [
        "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
        "0x6b175474e89094c44da98b954eedeac495271d0f",
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    ];
    const t1 = calldataGenerator_1.CalldataGenerator.swapTokens(amount, path, whale, 0);
    const calls = [
        {
            from: transactionData?.txObj.from,
            to: transactionData?.txObj.to,
            input: transactionData?.calldata,
        },
        { from: t1?.txObj.from, to: t1?.txObj.to, input: t1?.calldata },
    ];
    await _a.executeBatch(calls, path);
};
