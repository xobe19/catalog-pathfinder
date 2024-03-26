import { CHAIN_ID } from "../../../constants";
import { prisma } from "../../../services/dbClient";

async function main() {
  console.time("done in");

  try {
    const tokensAddresses = new Set<string>();

    [
      await prisma.pair.findMany({
        where: { chainId: CHAIN_ID.ARBITRUM },
        select: { token0Address: true, token1Address: true },
      }),
      await prisma.pairSushiSwap.findMany({
        where: { chainId: CHAIN_ID.ARBITRUM },
        select: { token0Address: true, token1Address: true },
      }),
      await prisma.pairPancakeSwap.findMany({
        where: { chainId: CHAIN_ID.ARBITRUM },
        select: { token0Address: true, token1Address: true },
      }),
    ].forEach((dex) => {
      dex.forEach((pair) => {
        tokensAddresses.add(pair.token0Address.toLowerCase());
        tokensAddresses.add(pair.token1Address.toLowerCase());
      });
    });

    console.log(`read ${tokensAddresses.size} tokens from db`);

    const addresses = Array.from(tokensAddresses);

    await prisma.token.createMany({
      data: addresses.map((a) => ({
        id: a,
        chainId: CHAIN_ID.ARBITRUM,
      })),
    });
    console.log(`inserted all token addresses`);
  } catch (ex) {
    console.error(ex);
  }

  console.timeEnd("done in");
}

main();
