"use strict";
/* TODO: remove ts-nocheck */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const multicall_1 = require("./multicall");
const constants_1 = require("../constants");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function fetchPairAddresses(start, count) {
    const calls = [];
    // batch all calls
    for (let i = 0; i < count; i++) {
        const prepCall = (0, multicall_1.prepareCall)(constants_1.UniswapV2Factory_ADDRESS, "allPairs", "function allPairs(uint) external view returns (address pair)", [i + start]);
        calls.push(prepCall);
    }
    const results = await (0, multicall_1.executeCalls)(calls);
    return results;
}
async function addToCsv(pairs) {
    let dataToWrite = (pairs.join("\n") + "\n").toLowerCase();
    let promise = new Promise((res, rej) => {
        fs_1.default.appendFile(path_1.default.join(__dirname, "data", "uniswap_v2_pair_addresses_new.csv"), dataToWrite, (err) => {
            if (err)
                rej(err);
            else
                res();
        });
    });
    await promise;
}
async function getPairsCount() {
    const prepCall = (0, multicall_1.prepareCall)(constants_1.UniswapV2Factory_ADDRESS, "allPairsLength", "function allPairsLength() external view returns (uint)");
    let x = (await (0, multicall_1.executeCalls)([prepCall]))[0][0];
    return Number(x);
}
async function main() {
    const count = await getPairsCount();
    const batchSize = 1000;
    const superBatchSize = 10;
    console.log(`Fetching ${count} pairs.`);
    console.log(`Batch size is ${batchSize}`);
    let start = 0;
    let end = Math.min(start + batchSize - 1, count - 1);
    let superBatch = [];
    while (end < count) {
        const batch = fetchPairAddresses(start, batchSize); // 1 rpc
        if (superBatch.length >= superBatchSize) {
            // time to execute batch
            let res = (await Promise.all(superBatch)).flat(1);
            console.log(`fetched till index ${end - batchSize}`);
            await addToCsv(res);
            await new Promise((res, rej) => setTimeout(() => {
                res();
            }, 1000));
            superBatch = [];
        }
        superBatch.push(batch);
        start = end + 1;
        end = end + batchSize;
    }
    if (end != count - 1) {
        end = count - 1;
        const batch = fetchPairAddresses(start, end - start + 1); // 1 rpc
        superBatch.push(batch);
    }
    let res = (await Promise.all(superBatch)).flat(1);
    console.log(`fetched till index ${end}`);
    await addToCsv(res);
    superBatch = [];
}
main();
