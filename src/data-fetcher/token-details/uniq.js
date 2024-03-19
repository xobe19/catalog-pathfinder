"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("node:fs/promises"));
async function main() {
    const files = [
        await promises_1.default.readFile("v2-tokens-from-db.txt", "utf-8"),
        await promises_1.default.readFile("pancake-tokens-from-db.txt", "utf-8"),
        await promises_1.default.readFile("sushi-tokens-from-db.txt", "utf-8"),
    ];
    const set = new Set();
    for (const file of files) {
        const lines = file.split("\n");
        for (const line of lines) {
            line
                .toLowerCase()
                .replace(/\"/g, "")
                .split("\t")
                .forEach((addr) => set.add(addr));
        }
    }
    for (const addr of set) {
        console.log(addr);
    }
}
main();
