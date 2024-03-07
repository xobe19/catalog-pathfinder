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
      `pushed ${isLiquidityCall ? "liquidity" : "slot0"}`,
      batchIndex
    );
    batchIndex++;
  }
  return res;
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

  console.log(liquidity);
}

main();
