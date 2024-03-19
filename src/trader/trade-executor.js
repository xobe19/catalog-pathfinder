"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeExecutor = void 0;
const ethers_1 = require("ethers");
const constants_1 = require("../constants");
const rpc_setup_1 = require("../rpc_setup");
const calldataGenerator_1 = require("./calldataGenerator");
class TradeExecutor {
    static async swapUniswapV2(from_address, private_key, { amountIn, amountOutMin, path }) {
        try {
            const txObj = calldataGenerator_1.CalldataGenerator.swapTokens(amountIn, path, from_address, amountOutMin);
            const signer = new ethers_1.ethers.Wallet(private_key).connect(rpc_setup_1.provider);
            const tx = await signer.sendTransaction({
                to: constants_1.UNISWAP_V2_ROUTER,
                from: from_address,
                data: txObj?.calldata,
            });
            await tx.wait();
            console.log(tx.hash);
        }
        catch (error) {
            console.log(error);
        }
    }
}
exports.TradeExecutor = TradeExecutor;
