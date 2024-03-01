-- CreateTable
CREATE TABLE "Token" (
    "address" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "PairToken" (
    "pair" TEXT NOT NULL,
    "token0Id" TEXT NOT NULL,
    "token1Id" TEXT NOT NULL,

    CONSTRAINT "PairToken_pkey" PRIMARY KEY ("pair")
);

-- CreateTable
CREATE TABLE "Pair" (
    "index" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "tokensId" TEXT,
    "token0Reserve" BIGINT,
    "token1Reserve" BIGINT,

    CONSTRAINT "Pair_pkey" PRIMARY KEY ("address")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pair_index_key" ON "Pair"("index");

-- AddForeignKey
ALTER TABLE "PairToken" ADD CONSTRAINT "PairToken_token0Id_fkey" FOREIGN KEY ("token0Id") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairToken" ADD CONSTRAINT "PairToken_token1Id_fkey" FOREIGN KEY ("token1Id") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pair" ADD CONSTRAINT "Pair_tokensId_fkey" FOREIGN KEY ("tokensId") REFERENCES "PairToken"("pair") ON DELETE SET NULL ON UPDATE CASCADE;
