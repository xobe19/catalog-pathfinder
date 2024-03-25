"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MULTICALL_ABI_ETHERS = exports.UNISWAP_V2_ROUTER = exports.MULTICALL_ADDRESS = exports.UniswapQuoter_ABI = exports.UniswapV3Quoter_ADDRESS = exports.UniswapV2Factory_ADDRESS = exports.GOERLI_ETH_URL = void 0;
exports.GOERLI_ETH_URL = "https://rpc.ankr.com/eth_goerli";
exports.UniswapV2Factory_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
/* https://github.com/mds1/multicall/blob/a53ad011e302d8162f185d3393666f912767af5c/examples/typescript/constants.ts */
exports.UniswapV3Quoter_ADDRESS = "0xb27308f9f90d607463bb33ea1bebb41c27ce5ab6";
exports.UniswapQuoter_ABI = [
    {
        inputs: [
            { internalType: "address", name: "_factory", type: "address" },
            { internalType: "address", name: "_WETH9", type: "address" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [],
        name: "WETH9",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "factory",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "bytes", name: "path", type: "bytes" },
            { internalType: "uint256", name: "amountIn", type: "uint256" },
        ],
        name: "quoteExactInput",
        outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "tokenIn", type: "address" },
            { internalType: "address", name: "tokenOut", type: "address" },
            { internalType: "uint24", name: "fee", type: "uint24" },
            { internalType: "uint256", name: "amountIn", type: "uint256" },
            { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "quoteExactInputSingle",
        outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "bytes", name: "path", type: "bytes" },
            { internalType: "uint256", name: "amountOut", type: "uint256" },
        ],
        name: "quoteExactOutput",
        outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "address", name: "tokenIn", type: "address" },
            { internalType: "address", name: "tokenOut", type: "address" },
            { internalType: "uint24", name: "fee", type: "uint24" },
            { internalType: "uint256", name: "amountOut", type: "uint256" },
            { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        name: "quoteExactOutputSingle",
        outputs: [{ internalType: "uint256", name: "amountIn", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "int256", name: "amount0Delta", type: "int256" },
            { internalType: "int256", name: "amount1Delta", type: "int256" },
            { internalType: "bytes", name: "path", type: "bytes" },
        ],
        name: "uniswapV3SwapCallback",
        outputs: [],
        stateMutability: "view",
        type: "function",
    },
];
exports.MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
exports.UNISWAP_V2_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
exports.MULTICALL_ABI_ETHERS = [
    // https://github.com/mds1/multicall
    "function aggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes[] returnData)",
    "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
    "function aggregate3Value(tuple(address target, bool allowFailure, uint256 value, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
    "function blockAndAggregate(tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)",
    "function getBasefee() view returns (uint256 basefee)",
    "function getBlockHash(uint256 blockNumber) view returns (bytes32 blockHash)",
    "function getBlockNumber() view returns (uint256 blockNumber)",
    "function getChainId() view returns (uint256 chainid)",
    "function getCurrentBlockCoinbase() view returns (address coinbase)",
    "function getCurrentBlockDifficulty() view returns (uint256 difficulty)",
    "function getCurrentBlockGasLimit() view returns (uint256 gaslimit)",
    "function getCurrentBlockTimestamp() view returns (uint256 timestamp)",
    "function getEthBalance(address addr) view returns (uint256 balance)",
    "function getLastBlockHash() view returns (bytes32 blockHash)",
    "function tryAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)",
    "function tryBlockAndAggregate(bool requireSuccess, tuple(address target, bytes callData)[] calls) payable returns (uint256 blockNumber, bytes32 blockHash, tuple(bool success, bytes returnData)[] returnData)",
];
