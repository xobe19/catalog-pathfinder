-- CreateTable
CREATE TABLE "PairSushiSwap" (
    "address" TEXT NOT NULL,
    "token0Address" TEXT NOT NULL,
    "token1Address" TEXT NOT NULL,
    "token0Reserve" TEXT NOT NULL,
    "token1Reserve" TEXT NOT NULL,

    CONSTRAINT "PairSushiSwap_pkey" PRIMARY KEY ("address")
);
