import { Prisma } from "@prisma/client";
import { prisma } from "./dbClient";

interface TokenList {
  tokens: {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
  }[];
}

async function main() {
  console.time("done in");

  const urls = [
    "https://tokens.uniswap.org/",
    "https://extendedtokens.uniswap.org/",
    "https://unsupportedtokens.uniswap.org/",
  ];

  for (const url of urls) {
    const response = await fetch(url, {
      method: "GET",
    });

    const data: TokenList = (await response.json()) as unknown as TokenList;

    for (const token of data.tokens) {
      const { chainId, address, decimals, symbol, name } = token;
      if (chainId !== 1) continue;
      try {
        const updated = await prisma.token.update({
          where: { id: address.toLowerCase() },
          data: {
            decimals,
            id: address.toLowerCase(),
            name,
            symbol,
          },
        });
        console.log(
          `updated ${updated.id} ${updated.name} (${updated.symbol})`
        );
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          /* https://www.prisma.io/docs/orm/reference/error-reference#p2025 */
          // Record to update not found
          if (e.code === "P2025") {
            await prisma.token.create({
              data: {
                id: address.toLowerCase(),
                symbol,
                name,
              },
            });
            console.log(`Added new token ${address} to db`);
          }
        }
      }
    }
  }

  console.timeLog("done in");
}
main();
