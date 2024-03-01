-- CreateTable
CREATE TABLE "PairMar1" (
    "address" TEXT NOT NULL,
    "token0Address" TEXT NOT NULL,
    "token1Address" TEXT NOT NULL,
    "token0Reserve" TEXT NOT NULL,
    "token1Reserve" TEXT NOT NULL,

    CONSTRAINT "PairMar1_pkey" PRIMARY KEY ("address")
);
