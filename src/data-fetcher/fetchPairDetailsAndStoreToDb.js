"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multicall_1 = require("./multicall");
const timestamp_1 = require("../timestamp");
const prisma = new client_1.PrismaClient();
function getCallsForPairDetails(pairAddress) {
    return [
        (0, multicall_1.prepareCall)(pairAddress, "getReserves", "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"),
        (0, multicall_1.prepareCall)(pairAddress, "token0", "function token0() external view returns (address)"),
        (0, multicall_1.prepareCall)(pairAddress, "token1", "function token1() external view returns (address)"),
    ];
}
function getMulticallBatch(pairAddresses, start, size) {
    const calls = [];
    for (let i = 0; i < size; i++) {
        calls.push(...getCallsForPairDetails(pairAddresses[i + start]));
    }
    const promiseOfResults = (0, multicall_1.executeCalls)(calls);
    return new Promise((resolve, reject) => {
        promiseOfResults
            .then((results) => resolve({
            results: results,
            start,
            size,
        }))
            .catch((err) => reject(err));
    });
}
function getPairDetailsFromExecuteCallsResult(pairAddress, executeCallsResults) {
    const ret = [];
    let j = 0;
    for (let i = 0; i < executeCallsResults.length; i += 3) {
        const reserves = executeCallsResults[i + 0];
        const token0 = executeCallsResults[i + 1];
        const token1 = executeCallsResults[i + 2];
        const token0Address = token0[0].toString().toLowerCase();
        const token1Address = token1[0].toString().toLowerCase();
        const pair = {
            address: pairAddress[j++].toLowerCase(),
            token0Address,
            token1Address,
            token0Reserve: reserves[0].toString(),
            token1Reserve: reserves[1].toString(),
        };
        ret.push(pair);
    }
    return ret;
}
function toDbPairs(pairAddresses, results) {
    const pairs = [];
    for (const resultBatch of results) {
        let i = 0;
        pairs.push(...getPairDetailsFromExecuteCallsResult(pairAddresses.slice(resultBatch.start, resultBatch.start + resultBatch.size), resultBatch.results));
    }
    return pairs;
}
async function main() {
    console.log(new Date().toLocaleString());
    console.time("service time");
    // clear the db first
    await prisma.pair.deleteMany({});
    console.log("db cleared");
    const pairAddressesFilePath = path_1.default.join(__dirname, "../../data", "uniswap_v2_pair_addresses.csv");
    try {
        const fileRef = fs_1.default.readFileSync(pairAddressesFilePath, "utf-8");
        const pairAddresses = fileRef.split("\n");
        if (pairAddresses[pairAddresses.length - 1] === "")
            pairAddresses.pop();
        console.log(`Pair addresses read from ${pairAddressesFilePath}`);
        // no. of contract read calls to batch into 1 RPC call
        const multicallbatchSize = 500;
        // no. of RPC calls to execute at a time
        let promiseBatchSize = 20;
        let promiseBatch = [];
        let resCount = 0;
        console.log("Pair data fetch start");
        for (let i = 0; i < pairAddresses.length; i += multicallbatchSize) {
            const size = Math.min(multicallbatchSize, pairAddresses.length - i);
            const res = getMulticallBatch(pairAddresses, i, size);
            promiseBatch.push(res);
            resCount += 1;
            if (size === pairAddresses.length - i || resCount === promiseBatchSize) {
                const results = await Promise.all(promiseBatch);
                await prisma.pair.createMany({
                    data: toDbPairs(pairAddresses, results),
                });
                console.log(`rows in db: ${i + size}`);
                resCount = 0;
                promiseBatch = [];
            }
        }
        console.log("Pair data fetch end");
    }
    catch (error) {
        console.error(error);
    }
    console.timeEnd("service time");
    console.log(new Date().toLocaleString());
    (0, timestamp_1.updateTimeStamp)();
}
main();
