"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const multicall_1 = require("./multicall");
async function main(batchSize) {
    const getPairLengthCall = [
        (0, multicall_1.prepareCall)("0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac", "allPairsLength", "function allPairsLength() external view returns (uint)"),
    ];
    const length = (await (0, multicall_1.executeCalls)(getPairLengthCall))[0].toString();
    const calls = [];
    for (let i = 0; i < parseInt(length); i++) {
        calls.push((0, multicall_1.prepareCall)("0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac", "allPairs", "function allPairs(uint) external view returns (address pair)", [i]));
    }
    const promiseArray = [];
    for (let i = 0; i < calls.length; i += batchSize) {
        promiseArray.push(calls.slice(i, i + batchSize));
    }
    const res = await (0, multicall_1.executeCalls)(calls);
    fs_1.default.writeFileSync("sushiswapPairs.json", JSON.stringify(res.flat()));
}
main(2);
