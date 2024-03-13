import { Request, Router } from "express";
import { findPaths } from "./services/find_path";
import { QuoteBody } from "./types";
import fs from "fs";
import path from "path";
export const router = Router();

router.get("/", (req, res) => {
  res.send("Hello world");
});

router.get("/health", (req, res) => {
  try {
    const timestamp = fs
      .readFileSync(path.join(__dirname, "../data", "timestamp.txt"), "utf-8")
      .split("\n")[0];

    res.send(`Reserves Updated at ${timestamp}`);
  } catch (error) {
    res.send(error);
  }
});

router.post("/updateTimeStamp", (req, res) => {
  const currentTime = new Date();
  const currentOffset = currentTime.getTimezoneOffset();
  const ISTTime = new Date(
    currentTime.getTime() + (330 + currentOffset) * 60000
  );
  fs.writeFileSync(
    path.join(__dirname, "../data", "timestamp.txt"),
    ISTTime.toString()
  );
  res.send(`timestamp updated ${ISTTime}`);
});

/* 
{
  "tokenInAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "tokenOutAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "amount": "4000000000"
}
*/
router.post("/quote", async (req: Request<any, any, QuoteBody>, res) => {
  try {
    const {
      body: { tokenInAddress, tokenOutAddress, amount },
    } = req;
    console.log(req.body);
    const path = await findPaths(
      tokenInAddress,
      tokenOutAddress,
      BigInt(amount)
    );
    res.json(path);
  } catch (ex) {
    console.error(ex);
    const err = ex as Error;
    res.json({ error: err.message });
  }
});
