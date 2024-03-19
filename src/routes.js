"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const ethers_1 = require("ethers");
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dbClient_1 = require("./services/dbClient");
const find_path_1 = require("./services/find_path");
exports.router = (0, express_1.Router)();
exports.router.get("/", (req, res) => {
    res.send("Hello world");
});
exports.router.get("/health", (req, res) => {
    try {
        const timestamp = fs_1.default
            .readFileSync(path_1.default.join(__dirname, "../data", "timestamp.txt"), "utf-8")
            .split("\n")[0];
        res.send(`Reserves Updated at ${timestamp}`);
    }
    catch (error) {
        res.send(error);
    }
});
function findPathResultToResponse(resultPath, tokenMap, userFriendly) {
    if (typeof resultPath === "string") {
        return resultPath;
    }
    return resultPath.slice(1).map((ele) => {
        const [address, amount, dex] = ele;
        const decimals = tokenMap.get(address)?.decimals;
        const name = tokenMap.get(address)?.name;
        return {
            address: ele[0],
            amountOut: userFriendly && decimals ? (0, ethers_1.formatUnits)(amount, decimals) : amount,
            name: name ?? "",
            dex,
        };
    });
}
/*
{
  "tokenInAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "tokenOutAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "amount": "4000000000"
}
*/
exports.router.post("/quote", async (req, res) => {
    try {
        const { amount, userFriendly } = req.body;
        const tokenInAddress = req.body.tokenInAddress.toLowerCase();
        const tokenOutAddress = req.body.tokenOutAddress.toLowerCase();
        const many = await dbClient_1.prisma.token.findMany({
            where: {
                id: { in: [tokenInAddress, tokenOutAddress] },
            },
        });
        const tokenIn = many.find((tok) => tok.id === tokenInAddress);
        const tokenOut = many.find((tok) => tok.id === tokenOutAddress);
        if (!tokenIn) {
            throw new Error(`Token ${tokenInAddress} not found`);
        }
        if (!tokenOut) {
            throw new Error(`Token ${tokenOut} not found`);
        }
        let amountFromUserFriendly = BigInt(0);
        if (userFriendly) {
            if (!tokenIn.decimals)
                throw new Error(`Token ${tokenIn.id} decimals not found`);
            if (!tokenOut.decimals)
                throw new Error(`Token ${tokenOut.id} decimals not found`);
            amountFromUserFriendly = (0, ethers_1.parseUnits)(amount, tokenIn.decimals);
        }
        console.log(new Date()) + ": ";
        console.log(req.body);
        const path = await (0, find_path_1.findPaths)(tokenInAddress, tokenOutAddress, userFriendly ? amountFromUserFriendly : BigInt(amount));
        /* TODO: make sure it only accepts all dexes, nothing less, nothing more */
        const pathValues = [
            path[find_path_1.dexes.uniswapV2],
            path[find_path_1.dexes.uniswapV3],
            path[find_path_1.dexes.sushiSwap],
            path[find_path_1.dexes.pancakeSwap],
            path[find_path_1.dexes.all],
        ];
        const addrs = new Set();
        for (const val of pathValues) {
            if (typeof val !== "string") {
                val.forEach((e) => addrs.add(e[0]));
            }
        }
        const tokens = await dbClient_1.prisma.token.findMany({
            where: {
                id: { in: Array.from(addrs) },
            },
        });
        const tokenMap = new Map();
        for (const token of tokens) {
            tokenMap.set(token.id, token);
        }
        const ret = {
            tokenIn: {
                address: tokenIn.id,
                name: tokenIn.name ?? "",
                amount,
            },
            tokenOut: {
                address: tokenOut.id,
                name: tokenOut.name ?? "",
            },
            path: {
                [find_path_1.dexes.uniswapV2]: findPathResultToResponse(path[find_path_1.dexes.uniswapV2], tokenMap, userFriendly),
                [find_path_1.dexes.sushiSwap]: findPathResultToResponse(path[find_path_1.dexes.sushiSwap], tokenMap, userFriendly),
                [find_path_1.dexes.pancakeSwap]: findPathResultToResponse(path[find_path_1.dexes.pancakeSwap], tokenMap, userFriendly),
                [find_path_1.dexes.uniswapV3]: findPathResultToResponse(path[find_path_1.dexes.uniswapV3], tokenMap, userFriendly),
                [find_path_1.dexes.all]: findPathResultToResponse(path[find_path_1.dexes.all], tokenMap, userFriendly),
            },
        };
        res.json(ret);
    }
    catch (ex) {
        console.error(ex);
        const err = ex;
        res.json({ error: err.message });
    }
});
