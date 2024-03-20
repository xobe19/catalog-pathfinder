import { Token } from "@prisma/client";
import { formatUnits, parseUnits } from "ethers";
import { Request, Router } from "express";
import fs from "fs";
import nodepath from "path";
import { prisma } from "./services/dbClient";
import { findPaths } from "./services/find_path";
import { QuoteBody, QuotePathMember, QuoteResponse } from "./types";

export const router = Router();

router.get("/", (req, res) => {
  res.send("Hello world");
});

router.get("/health", (req, res) => {
  try {
    const timestamp = fs
      .readFileSync(
        nodepath.join(__dirname, "../data", "timestamp.txt"),
        "utf-8"
      )
      .split("\n")[0];

    res.send(`Reserves Updated at ${timestamp}`);
  } catch (error) {
    res.send(error);
  }
});

function findPathResultToResponse(
  paths: Awaited<ReturnType<typeof findPaths>>,
  tokenMap: Map<string, Token>,
  userFriendly: boolean
): QuoteResponse["path"] {
  let dex: keyof typeof paths;
  for (dex in paths) {
    for (const path of paths[dex]) {
      if (typeof path !== "string") {
        const decimals = tokenMap.get(path.address)?.decimals;
        // add name to path
        (path as QuotePathMember).name = tokenMap.get(path.address)?.name ?? "";
        // format number with decimals
        (path as QuotePathMember).amountOut =
          userFriendly && decimals
            ? formatUnits(path.amountOut, decimals)
            : path.amountOut;
      }
    }
  }
  return paths as QuoteResponse["path"];
}

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
    const paths = await findPaths(
      tokenInAddress,
      tokenOutAddress,
      userFriendly ? amountFromUserFriendly : BigInt(amount)
    );

    const uniqueTokens = new Set<string>();

    let dex: keyof typeof paths;
    for (dex in paths) {
      const path = paths[dex];
      if (typeof path !== "string") {
        path.forEach((e) => uniqueTokens.add(e.address));
      }
    }

    const tokens = await prisma.token.findMany({
      where: {
        id: { in: Array.from<string>(uniqueTokens) },
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
      path: findPathResultToResponse(paths, tokenMap, userFriendly),
    };

    res.json(ret);
  } catch (ex) {
    console.error(ex);
    const err = ex as Error;
    res.json({ error: err.message });
  }
});
