"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const multicall_1 = require("./multicall");
async function main(batchSize) {
    const getPairLengthCall = [
        (0, multicall_1.prepareCall)("0x1097053Fd2ea711dad45caCcc45EfF7548fCB362", "allPairsLength", "function allPairsLength() external view returns (uint)"),
    ];
    const length = (await (0, multicall_1.executeCalls)(getPairLengthCall))[0].toString();
    const calls = [];
    for (let i = 0; i < parseInt(length); i++) {
        calls.push((0, multicall_1.prepareCall)("0x1097053Fd2ea711dad45caCcc45EfF7548fCB362", "allPairs", "function allPairs(uint) external view returns (address pair)", [i]));
    }
    const promiseArray = [];
    for (let i = 0; i < calls.length; i += batchSize) {
        promiseArray.push(calls.slice(i, i + batchSize));
    }
    const res = await (0, multicall_1.executeCalls)(calls);
    fs_1.default.writeFileSync("pancakeSwap.json", JSON.stringify(res.flat()));
}
main(2);
