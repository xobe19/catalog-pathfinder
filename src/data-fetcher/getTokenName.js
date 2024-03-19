"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenName = exports.ETHER_SCAN_API = void 0;
const ethers_1 = require("ethers");
const abis_1 = require("./abis");
const rpc_setup_1 = require("../rpc_setup");
exports.ETHER_SCAN_API = process.env.ETHER_SCAN_API;
if (!exports.ETHER_SCAN_API)
    throw new Error("Please set the MAINNET_RPC_URL environment variable.");
const ABI_CHECK = [
    abis_1.symbolABI,
    abis_1.getsymbolAbi,
    abis_1.upgradableContractABI,
    abis_1.symbolABIBytes,
    abis_1.symbolABIBytes64,
];
async function getTokenName(tokenAddr) {
    let tokenName = "";
    try {
        const instance = new ethers_1.Contract(tokenAddr, abis_1.symbolABI, rpc_setup_1.provider);
        tokenName = await instance.symbol();
    }
    catch (e) {
        try {
            const bytes32instance = new ethers_1.Contract(tokenAddr, abis_1.symbolABIBytes, rpc_setup_1.provider);
            tokenName = (0, ethers_1.decodeBytes32String)(await bytes32instance.symbol());
        }
        catch (error) {
            const upgradableContractInstance = new ethers_1.Contract(tokenAddr, abis_1.upgradableContractABI, rpc_setup_1.provider);
            const addr = await upgradableContractInstance.implementation();
            tokenName = await getTokenName(addr);
        }
    }
    return tokenName;
}
exports.getTokenName = getTokenName;
