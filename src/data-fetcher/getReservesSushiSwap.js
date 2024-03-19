"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multicall_1 = require("./multicall");
const fs_1 = __importDefault(require("fs"));
async function getReserves() {
    const allpairs = fs_1.default.readFileSync("sushiswapPairs.txt").toString().split("\n");
    const calls = [];
    for (let i = 0; i < allpairs.length; i++) {
        calls.push((0, multicall_1.prepareCall)(allpairs[i], "getReserves", "function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)"));
    }
    const batchSize = 2;
    const promiseArray = [];
    for (let i = 0; i < calls.length; i += batchSize) {
        promiseArray.push(calls.slice(i, i + batchSize));
    }
    const res = await (0, multicall_1.executeCalls)(calls);
    console.log(res);
}
getReserves();
