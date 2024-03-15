import { Prisma } from "@prisma/client";
import { prisma } from "./dbClient";

import tokenData from "./subgraph-token-data.json";

async function main() {
  console.time("done in");

  const {
    data: { tokens },
  } = tokenData;

  for (const token of tokens) {
    const { id, symbol, name, decimals } = token;
    try {
      const updated = await prisma.token.update({
        where: { id: id.toLowerCase() },
        data: {
          symbol,
          name,
          decimals: parseInt(decimals, 10),
        },
      });
      console.log(`updated ${updated.id} ${updated.name} (${updated.symbol})`);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        /* https://www.prisma.io/docs/orm/reference/error-reference#p2025 */
        // Record to update not found
        if (e.code === "P2025") {
          await prisma.token.create({
            data: {
              id: id.toLowerCase(),
              symbol,
              name,
              decimals: parseInt(decimals, 10),
            },
          });
          console.log(`Added new token ${id} to db`);
        }
      }
    }
  }

  console.timeEnd("done in");
}
main();
