"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMaxTokenHolder = void 0;
const axios_1 = __importDefault(require("axios"));
async function getMaxTokenHolder(tokenAddr) {
    let res = await axios_1.default.get("https://api.chainbase.online/v1/token/top-holders?chain_id=1&contract_address=" +
        tokenAddr +
        "&page=1&limit=1", {
        headers: {
            "x-api-key": process.env.CHAINBASE_API,
        },
    });
    return res.data.data[0].wallet_address;
}
exports.getMaxTokenHolder = getMaxTokenHolder;
