"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCalls = exports.prepareCallVariable = exports.prepareCall = exports.multicall = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const ethers_1 = require("ethers");
const constants_1 = require("../constants");
dotenv_1.default.config();
// Setup the provider
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL;
if (!MAINNET_RPC_URL)
    throw new Error("Please set the MAINNET_RPC_URL environment variable.");
const provider = new ethers_1.JsonRpcProvider(MAINNET_RPC_URL);
// Get Multicall contract instance.
exports.multicall = new ethers_1.Contract(constants_1.MULTICALL_ADDRESS, constants_1.MULTICALL_ABI_ETHERS, provider);
function prepareCall(contractAddress, functionName, interfaceAbi, args) {
    const functionInterface = new ethers_1.Interface([interfaceAbi]);
    const call = {
        target: contractAddress,
        allowFailure: true,
        callData: functionInterface.encodeFunctionData(functionName, args),
    };
    const decodeResult = (result) => {
        return functionInterface.decodeFunctionResult(functionName, result);
    };
    return {
        contractAddress,
        functionName,
        functionInterface,
        call,
        decodeResult,
    };
}
exports.prepareCall = prepareCall;
function prepareCallVariable(contractAddress, variableName, abi) {
    const functionInterface = new ethers_1.Interface(abi);
    const call = {
        target: contractAddress,
        allowFailure: true,
        callData: functionInterface.encodeFunctionData(variableName),
    };
    const decodeResult = (result) => {
        return functionInterface.decodeFunctionResult(variableName, result);
    };
    return {
        contractAddress,
        functionName: variableName,
        functionInterface,
        call,
        decodeResult,
    };
}
exports.prepareCallVariable = prepareCallVariable;
async function executeCalls(calls, decode = (result, call) => {
    return call.decodeResult(result.returnData);
}) {
    const call3s = calls.map((call) => call.call);
    const results = await exports.multicall.aggregate3.staticCall(call3s);
    return results.map((result, i) => decode(result, calls[i]));
}
exports.executeCalls = executeCalls;
