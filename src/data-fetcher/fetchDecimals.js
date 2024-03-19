"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const multicall_1 = require("./multicall");
async function getAllTokens() {
    return fs_1.default.readFileSync("../../data/tokenadddress.txt", "utf-8").split("\n");
}
async function fetchDecimals() {
    const TOKENS = await getAllTokens();
    const calls = [];
    const start = 1000;
    const end = 2000;
    const batchSize = 3;
    const failedTokens = [];
    const results = [];
    for (let i = start; i < end; i += batchSize) {
        const inter = [];
        const batchTokens = TOKENS.slice(i, i + batchSize);
        try {
            for (let j = 0; j < batchTokens.length; j++) {
                inter.push((0, multicall_1.prepareCall)(batchTokens[j], "decimals", "function decimals() public view returns (uint8)"));
            }
            const res = await (0, multicall_1.executeCalls)(inter);
            const arr = { address: batchTokens, decimals: res };
            results.push(arr);
        }
        catch (error) {
            console.log(batchTokens);
            failedTokens.push(batchTokens);
        }
    }
    console.log(failedTokens);
    // const query = await prisma.$executeRawUnsafe();
}
fetchDecimals();
