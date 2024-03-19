"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dbClient_1 = require("../../services/dbClient");
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
        const data = (await response.json());
        for (const token of data.tokens) {
            const { chainId, address, decimals, symbol, name } = token;
            if (chainId !== 1)
                continue;
            try {
                const updated = await dbClient_1.prisma.token.update({
                    where: { id: address.toLowerCase() },
                    data: {
                        decimals,
                        id: address.toLowerCase(),
                        name,
                        symbol,
                    },
                });
                console.log(`updated ${updated.id} ${updated.name} (${updated.symbol})`);
            }
            catch (e) {
                if (e instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    /* https://www.prisma.io/docs/orm/reference/error-reference#p2025 */
                    // Record to update not found
                    if (e.code === "P2025") {
                        await dbClient_1.prisma.token.create({
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
