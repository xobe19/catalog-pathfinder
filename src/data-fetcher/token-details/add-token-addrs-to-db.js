"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
const dbClient_1 = require("../../services/dbClient");
async function main() {
    console.time("done in");
    try {
        const filePath = "token-addresses.txt";
        const file = await promises_1.default.readFile(filePath, "utf-8");
        console.log(`read file ${filePath}`);
        const addresses = file.split("\n").filter((e) => !!e);
        await dbClient_1.prisma.token.createMany({
            data: addresses.map((a) => ({
                id: a,
            })),
        });
        console.log(`inserted all token addresses`);
    }
    catch (ex) {
        console.error(ex);
    }
    console.timeEnd("done in");
}
main();
