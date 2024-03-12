import { Router, Request } from "express";
import { QuoteBody } from "./types";
import { findPath } from "./services/find_path";

export const router = Router();

router.get("/", (req, res) => {
  res.send("Hello world");
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
    const path = await findPath(
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
