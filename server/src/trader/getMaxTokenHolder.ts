import axios from "axios";
import processEnvSafe from "../safeEnv";

export async function getMaxTokenHolder(tokenAddr: string) {
  let res = await axios.get(
    "https://api.chainbase.online/v1/token/top-holders?chain_id=1&contract_address=" +
      tokenAddr +
      "&page=1&limit=1",
    {
      headers: {
        "x-api-key": processEnvSafe("CHAINBASE_API"),
      },
    }
  );
  return res.data.data[0].wallet_address;
}
