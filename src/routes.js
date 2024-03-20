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
function findPathResultToResponse(paths, tokenMap, userFriendly) {
    let dex;
    for (dex in paths) {
        for (const path of paths[dex]) {
            if (typeof path !== "string") {
                const decimals = tokenMap.get(path.address)?.decimals;
                // add name to path
                path.name = tokenMap.get(path.address)?.name ?? "";
                // format number with decimals
                path.amountOut =
                    userFriendly && decimals
                        ? (0, ethers_1.formatUnits)(path.amountOut, decimals)
                        : path.amountOut;
            }
        }
    }
    return paths;
}
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
        console.log(new Date() + ": ");
        console.log(req.body);
        const paths = await (0, find_path_1.findPaths)(tokenInAddress, tokenOutAddress, userFriendly ? amountFromUserFriendly : BigInt(amount));
        const uniqueTokens = new Set();
        let dex;
        for (dex in paths) {
            const path = paths[dex];
            if (typeof path !== "string") {
                path.forEach((e) => uniqueTokens.add(e.address));
            }
        }
        const tokens = await dbClient_1.prisma.token.findMany({
            where: {
                id: { in: Array.from(uniqueTokens) },
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
            path: findPathResultToResponse(paths, tokenMap, userFriendly),
        };
        res.json(ret);
    }
    catch (ex) {
        console.error(ex);
        const err = ex;
        res.json({ error: err.message });
    }
});
