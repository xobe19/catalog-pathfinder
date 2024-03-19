import { Token } from "@prisma/client";
import { formatUnits, parseUnits } from "ethers";
import { Request, Router } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "./services/dbClient";
import { dexes, findPaths } from "./services/find_path";
import { QuoteBody, QuoteResponse } from "./types";

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

function findPathResultToResponse(
  resultPath: string | any[][],
  tokenMap: Map<string, Token>,
  userFriendly: boolean
) {
  if (typeof resultPath === "string") {
    return resultPath;
  }

  return resultPath.slice(1).map((ele) => {
    const [address, amount, dex] = ele;
    const decimals = tokenMap.get(address)?.decimals;
    const name = tokenMap.get(address)?.name;
    return {
      address: ele[0],
      amountOut:
        userFriendly && decimals ? formatUnits(amount, decimals) : amount,
      name: name ?? "",
      dex,
    };
  });
}

/* 
{
  "tokenInAddress": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "tokenOutAddress": "0xdac17f958d2ee523a2206206994597c13d831ec7",
  "amount": "4000000000"
}
*/
router.post("/quote", async (req: Request<any, any, QuoteBody>, res) => {
  try {
    const { amount, userFriendly } = req.body;
    const tokenInAddress = req.body.tokenInAddress.toLowerCase();
    const tokenOutAddress = req.body.tokenOutAddress.toLowerCase();

    const many = await prisma.token.findMany({
      where: {
        id: { in: [tokenInAddress, tokenOutAddress] },
      },
    });
    const tokenIn = many.find((tok) => tok.id === tokenInAddress)!;
    const tokenOut = many.find((tok) => tok.id === tokenOutAddress)!;

    if (!tokenIn) {
      throw new Error(`Token ${tokenInAddress} not found`);
    }
    if (!tokenOut) {
      throw new Error(`Token ${tokenOut} not found`);
    }

    let amountFromUserFriendly: bigint = BigInt(0);
    if (userFriendly) {
      if (!tokenIn.decimals)
        throw new Error(`Token ${tokenIn.id} decimals not found`);
      if (!tokenOut.decimals)
        throw new Error(`Token ${tokenOut.id} decimals not found`);

      amountFromUserFriendly = parseUnits(amount, tokenIn.decimals);
    }

    console.log(new Date() + ": ");
    console.log(req.body);
    const path = await findPaths(
      tokenInAddress,
      tokenOutAddress,
      userFriendly ? amountFromUserFriendly : BigInt(amount)
    );

    /* TODO: make sure it only accepts all dexes, nothing less, nothing more */
    const pathValues = [
      path[dexes.uniswapV2],
      path[dexes.uniswapV3],
      path[dexes.sushiSwap],
      path[dexes.pancakeSwap],
      path[dexes.all],
    ];

    const addrs = new Set<string>();
    for (const val of pathValues) {
      if (typeof val !== "string") {
        val.forEach((e) => addrs.add(e[0]));
      }
    }

    const tokens = await prisma.token.findMany({
      where: {
        id: { in: Array.from<string>(addrs) },
      },
    });
    const tokenMap = new Map<string, Token>();
    for (const token of tokens) {
      tokenMap.set(token.id, token);
    }

    const ret: QuoteResponse = {
      tokenIn: {
        address: tokenIn.id,
        name: tokenIn.name ?? "",
        amount,
      },
      tokenOut: {
        address: tokenOut.id,
        name: tokenOut.name ?? "",
      },
      path: {
        [dexes.uniswapV2]: findPathResultToResponse(
          path[dexes.uniswapV2],
          tokenMap,
          userFriendly
        ),
        [dexes.sushiSwap]: findPathResultToResponse(
          path[dexes.sushiSwap],
          tokenMap,
          userFriendly
        ),
        [dexes.pancakeSwap]: findPathResultToResponse(
          path[dexes.pancakeSwap],
          tokenMap,
          userFriendly
        ),
        [dexes.uniswapV3]: findPathResultToResponse(
          path[dexes.uniswapV3],
          tokenMap,
          userFriendly
        ),
        [dexes.all]: findPathResultToResponse(
          path[dexes.all],
          tokenMap,
          userFriendly
        ),
      },
    };

    res.json(ret);
  } catch (ex) {
    console.error(ex);
    const err = ex as Error;
    res.json({ error: err.message });
  }
});
