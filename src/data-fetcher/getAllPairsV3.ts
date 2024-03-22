import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { PairV3, PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { updateTimeStamp } from "../timestamp";
import { decodeFunction } from "../types";
import { executeCalls, prepareCall } from "./multicall";
dotenv.config();

const GRAPHQL_URL = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.GRAPH_API_KEY}/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`;

const prisma = new PrismaClient();

async function main() {
  // !! CLEARING  DB BEFORE UPDATEING

  console.log("cleared pairV3 db");
  await prisma.pairV3.deleteMany({});

  const tokensQuery = gql`
    query GetPools($skip: Int) {
      pools(first: 1000, skip: $skip) {
        id
        liquidity
        feeTier
        tick
        sqrtPrice
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
      }
    }
  `;

  const client = new ApolloClient({
    uri: GRAPHQL_URL,
    cache: new InMemoryCache(),
  });
  const start = 0;
  const batchSize = 1000;
  const pairLength = 21000;

  for (let i = start; i < pairLength; i += batchSize) {
    const res = await client.query({
      query: tokensQuery,
      variables: {
        skip: i,
      },
    });

    const prismaWithOutHolding: any[] = res.data.pools.map((e: any) => {
      const tick = e.tick ? parseInt(e.tick) : 0;
      return {
        address: e.id,
        liquidity: e.liquidity,
        sqrtPriceX96: e.sqrtPrice,
        fees: parseInt(e.feeTier),
        tick: tick,
        token0Address: e.token0.id,
        token0Decimals: parseInt(e.token0.decimals),
        token0Symbol: e.token0.symbol,
        token1Address: e.token1.id,
        token1Decimals: parseInt(e.token1.decimals),
        token1Symbol: e.token1.symbol,
      };
    });

    const Abi =
      "function balanceOf(address account) external view returns (uint256)";
    const calls = [];
    for (let i = 0; i < prismaWithOutHolding.length; i++) {
      const contractAddress = prismaWithOutHolding[i].address;
      const token0Address = prismaWithOutHolding[i].token0Address;
      const token1Address = prismaWithOutHolding[i].token1Address;

      const singleCall = [
        prepareCall(token0Address, "balanceOf", Abi, [contractAddress]),
        prepareCall(token1Address, "balanceOf", Abi, [contractAddress]),
      ];
      calls.push(...singleCall);
    }
    const decode: decodeFunction = (result, call) => {
      try {
        return call.decodeResult(result.returnData)[0];
      } catch (e) {
        return 0;
      }
    };
    const result = await executeCalls(calls, decode);

    const prismaToDB: PairV3[] = [];
    let k = 0;
    for (let i = 0; i < result.length; i += 2) {
      const p: PairV3 = {
        token0Balance: result[i].toString(),
        token1Balance: result[i + 1].toString(),
        ...prismaWithOutHolding[k++],
      };
      prismaToDB.push(p);
    }

    await prisma.pairV3.createMany({
      data: prismaToDB,
    });
    console.log(`pushed ${i} to db `);
  }
  await updateTimeStamp();
}

main();
