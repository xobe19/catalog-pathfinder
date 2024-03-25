"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuoteV3 = void 0;
const rpc_setup_1 = require("../rpc_setup");
const dotenv_1 = __importDefault(require("dotenv"));
const bottleneck_1 = __importDefault(require("bottleneck"));
dotenv_1.default.config();
const limiter = new bottleneck_1.default({
    maxConcurrent: 1,
    minTime: 40,
});
async function getQuoteV3(inTokenAddress, outTokenAddress, fee, inAmount) {
    // console.log(JSON.stringify(contract));
    try {
        return await limiter.schedule(() => rpc_setup_1.Quotercontract.quoteExactInputSingle.staticCall(inTokenAddress, outTokenAddress, fee, inAmount, 0));
    }
    catch {
        return 0;
    }
}
exports.getQuoteV3 = getQuoteV3;
// (async function () {
//   console.log(
//     await getQuoteV3(
//       "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
//       "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
//       10000,
//       "1000000000"
//     )
//   );
// })();
