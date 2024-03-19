"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const abis_1 = require("./abis");
const multicall_1 = require("./multicall");
const timestamp_1 = require("../timestamp");
const prisma = new client_1.PrismaClient();
async function getMulticallBatch(pairAddresses, size, isLiquidityCall) {
    const calls = [];
    for (let i = 0; i < pairAddresses.length; i += size) {
        const start = i;
        const end = start + size > pairAddresses.length ? pairAddresses.length : start + size;
        const singleCalls = [];
        for (let j = start; j < end; j++) {
            singleCalls.push((0, multicall_1.prepareCallVariable)(pairAddresses[j], isLiquidityCall ? "liquidity" : "slot0", abis_1.UNISWAP_POOL_ABI));
        }
        calls.push(singleCalls);
    }
    let batchIndex = 0;
    const res = [];
    for await (let i of calls) {
        const single = await (0, multicall_1.executeCalls)(i);
        res.push(single);
        console.log(`fetched ${isLiquidityCall ? "liquidity" : "slot0"}`, batchIndex);
        batchIndex++;
    }
    return res;
}
function getValuesStringFromExecuteCallsResult(pairAddress, newliquidity, newsqrtPriceX96) {
    const ret = [];
    for (let i = 0; i < pairAddress.length; i++) {
        const address = pairAddress[i];
        const liquidity = newliquidity[i];
        const sqrtPriceX96 = newsqrtPriceX96[i].split(",")[0];
        ret.push(`('${address.toLowerCase()}', '${liquidity}', '${sqrtPriceX96}')`);
    }
    return ret;
}
async function main() {
    const address = [];
    let allV3Pairs = await prisma.pairV3.findMany({
        select: { address: true },
    });
    allV3Pairs.map((e) => {
        address.push(e.address);
    });
    const [liquidity, slot0] = await Promise.all([
        getMulticallBatch(address, 2500, true),
        getMulticallBatch(address, 2500, false),
    ]);
    const allliq = [];
    const sqrtinfo = [];
    for (let i = 0; i < liquidity.length; i++) {
        const singleL = liquidity[i];
        const singleP = slot0[i];
        const lArray = singleL.map((value) => value.toString());
        const sqrt96Array = singleP.map((value) => value.toString());
        allliq.push(...lArray);
        sqrtinfo.push(...sqrt96Array);
    }
    const resultToDb = getValuesStringFromExecuteCallsResult(address, allliq, sqrtinfo);
    const toDbUpdateQuery = resultToDb.join(", ");
    await prisma.$executeRawUnsafe(`UPDATE "PairV3"
    SET "liquidity" = new_values.new_liquidity,
        "sqrtPriceX96" = new_values.new_sqrtPriceX96
    FROM (
        VALUES 
            ${toDbUpdateQuery}
        ) AS new_values (address, new_liquidity, new_sqrtPriceX96)
    WHERE "PairV3".address = new_values.address`);
    console.log("db updated for pairV3");
    await (0, timestamp_1.updateTimeStamp)();
}
main();
