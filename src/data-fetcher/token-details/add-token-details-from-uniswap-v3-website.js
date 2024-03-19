"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dbClient_1 = require("../../services/dbClient");
const uniswap_v3_website_json_1 = __importDefault(require("./uniswap-v3-website.json"));
async function main() {
    console.time("done in");
    const tokens = uniswap_v3_website_json_1.default.data;
    for (const token of tokens) {
        const { id, symbol, name, decimals } = token;
        try {
            const updated = await dbClient_1.prisma.token.update({
                where: { id: id.toLowerCase() },
                data: {
                    symbol,
                    name,
                    decimals: parseInt(decimals),
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
                            id: id.toLowerCase(),
                            symbol,
                            name,
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
