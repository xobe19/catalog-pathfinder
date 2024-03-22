-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "symbol" TEXT,
    "name" TEXT,
    "decimals" INTEGER,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);
