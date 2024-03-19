"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalldataGenerator = void 0;
const ethers_1 = require("ethers");
const rpc_setup_1 = require("../rpc_setup");
const constants_1 = require("../constants");
const abis_1 = require("../data-fetcher/abis");
class CalldataGenerator {
    /**
     * @param amountIn - Amount of input tokens to send.
     * @param path - List of token address
     * @param walletAddress - sender address
     * @param amountOutMin -  Minimum amount of output tokens that must be received for the transaction not to revert.
     * @returns call data for transaction
     */
    static swapTokens(amountIn, path, walletAddress, amountOutMin) {
        try {
            const contractInstance = new ethers_1.Contract(constants_1.UNISWAP_V2_ROUTER, abis_1.swapABI, rpc_setup_1.provider);
            const deadline = Math.floor(Date.now() / 1000) + 60 * 10;
            const txInfo = {
                amountIn: amountIn,
                amountOutMin: amountOutMin ? amountOutMin : 0,
                path: path,
                to: walletAddress,
                deadline: deadline,
            };
            const calldata = contractInstance.interface.encodeFunctionData("swapExactTokensForTokens", [
                txInfo.amountIn,
                txInfo.amountOutMin,
                txInfo.path,
                txInfo.to,
                txInfo.deadline,
            ]);
            const txObj = {
                to: constants_1.UNISWAP_V2_ROUTER,
                data: calldata,
                from: walletAddress,
            };
            return { calldata: calldata, txObj: txObj };
        }
        catch (error) {
            console.log(error);
        }
    }
    /**
     * Approves spending of ERC20 tokens by a spender address.
     *
     * @param ERC20_TOKEN - The address of the ERC20 token.
     * @param spender_address - The address of the spender.
     * @param amount - The amount of tokens to approve for spending.
     * @param from_address -  `msg.sender`
     * @returns The call data for the transaction.
     */
    static approveTokens(ERC20_TOKEN, spender_address, amount, from_address) {
        try {
            const contractInstance = new ethers_1.Contract(ERC20_TOKEN, abis_1.approveERC20Abi, rpc_setup_1.provider);
            const calldata = contractInstance.interface.encodeFunctionData("approve", [spender_address, amount]);
            const txObj = {
                to: ERC20_TOKEN,
                data: calldata,
                from: from_address,
            };
            return { calldata: calldata, txObj: txObj };
        }
        catch (error) {
            console.log(error);
        }
    }
}
exports.CalldataGenerator = CalldataGenerator;
