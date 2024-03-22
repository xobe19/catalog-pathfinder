-- CreateTable
CREATE TABLE "PairV3" (
    "address" TEXT NOT NULL,
    "liquidity" TEXT NOT NULL,
    "sqrtPriceX96" TEXT NOT NULL,
    "fees" INTEGER NOT NULL,
    "token0Address" TEXT NOT NULL,
    "token0Decimals" INTEGER NOT NULL,
    "token0Symbol" TEXT NOT NULL,
    "token1Address" TEXT NOT NULL,
    "token1Decimals" INTEGER NOT NULL,
    "token1Symbol" TEXT NOT NULL,

    CONSTRAINT "PairV3_pkey" PRIMARY KEY ("address")
);
