import fs from "node:fs/promises";
import { CHAIN_ID } from "../../constants";
import { prisma } from "../../services/dbClient";

async function main() {
  console.time("done in");

  try {
    const filePath = "token-addresses.txt";
    const file = await fs.readFile(filePath, "utf-8");
    console.log(`read file ${filePath}`);
    const addresses = file.split("\n").filter((e) => !!e);
    await prisma.token.createMany({
      data: addresses.map((a) => ({
        id: a,
        chainId: CHAIN_ID.ETHEREUM,
      })),
    });
    console.log(`inserted all token addresses`);
  } catch (ex) {
    console.error(ex);
  }

  console.timeEnd("done in");
}

main();
