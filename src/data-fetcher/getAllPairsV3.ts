import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { PairV3, PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { updateTimeStamp } from "../timestamp";
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
    const primseToDB: PairV3[] = res.data.pools.map((e: any) => {
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
    await prisma.pairV3.createMany({
      data: primseToDB,
    });
    console.log(`pushed ${i} to db `);
  }
  await updateTimeStamp();
}
