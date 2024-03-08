import { PrismaClient } from "@prisma/client";
import { UNISWAP_POOL_ABI } from "./abis";
import { executeCalls, prepareCallVariable } from "./multicall";

const prisma = new PrismaClient();

async function getMulticallBatch(
  pairAddresses: string[],
  size: number,
  isLiquidityCall: boolean
) {
  const calls = [];

  for (let i = 0; i < pairAddresses.length; i += size) {
    const start = i;
    const end =
      start + size > pairAddresses.length ? pairAddresses.length : start + size;

    const singleCalls = [];
    for (let j = start; j < end; j++) {
      singleCalls.push(
        prepareCallVariable(
          pairAddresses[j],
          isLiquidityCall ? "liquidity" : "slot0",
          UNISWAP_POOL_ABI
        )
      );
    }
    calls.push(singleCalls);
  }

  let batchIndex = 0;
  const res = [];
  for await (let i of calls) {
    const single = await executeCalls(i);
    res.push(single);
    console.log(
      `fetched ${isLiquidityCall ? "liquidity" : "slot0"}`,
      batchIndex
    );
    batchIndex++;
  }
  return res;
}

function getValuesStringFromExecuteCallsResult(
  pairAddress: string[],
  newliquidity: string[],
  newsqrtPriceX96: string[]
): string[] {
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
  const address: string[] = [];

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

  const allliq: string[] = [];
  const sqrtinfo: string[] = [];

  for (let i = 0; i < liquidity.length; i++) {
    const singleL = liquidity[i];
    const singleP = slot0[i];

    const lArray = singleL.map((value) => value.toString());
    const sqrt96Array = singleP.map((value) => value.toString());

    allliq.push(...lArray);
    sqrtinfo.push(...sqrt96Array);
  }

  const resultToDb = getValuesStringFromExecuteCallsResult(
    address,
    allliq,
    sqrtinfo
  );

  const toDbUpdateQuery = resultToDb.join(", ");

  await prisma.$executeRawUnsafe(
    `UPDATE "PairV3"
    SET "liquidity" = new_values.new_liquidity,
        "sqrtPriceX96" = new_values.new_sqrtPriceX96
    FROM (
        VALUES 
            ${toDbUpdateQuery}
        ) AS new_values (address, new_liquidity, new_sqrtPriceX96)
    WHERE "PairV3".address = new_values.address`
  );
  console.log("db updated for pairV3");
}

main();
