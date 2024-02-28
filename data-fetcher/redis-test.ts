import { createClient } from "redis";

console.log("client create begin");
const client = createClient();
console.log("client create end");

client.on("error", (err) => console.log("Redis Client Error", err));

async function main() {
  await client.connect();
  await client.set("key", "value");
  const value = await client.get("key");
  console.log(value);

  client.quit();
}

main();
