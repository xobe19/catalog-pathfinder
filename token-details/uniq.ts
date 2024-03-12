import fs from "node:fs/promises";

async function main() {
  const files = [
    await fs.readFile("v2-tokens-from-db.txt", "utf-8"),
    await fs.readFile("pancake-tokens-from-db.txt", "utf-8"),
    await fs.readFile("sushi-tokens-from-db.txt", "utf-8"),
  ];
  const set = new Set<string>();

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
