import { createClient } from "redis";

export async function redis_client() {
  try {
    const client = createClient();
    client.on("error", (err) => console.log("Redis Client Error", err));
    await client.connect();
    console.log("redis connected");
  } catch (error) {
    console.log(error);
  }
}
