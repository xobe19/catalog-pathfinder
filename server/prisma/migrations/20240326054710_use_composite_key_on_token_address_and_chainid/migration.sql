/*
  Warnings:

  - The primary key for the `PairPancakeSwap` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PairSushiSwap` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Token` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "PairPancakeSwap" DROP CONSTRAINT "PairPancakeSwap_pkey",
ALTER COLUMN "chainId" DROP DEFAULT,
ADD CONSTRAINT "PairPancakeSwap_pkey" PRIMARY KEY ("address", "chainId");

-- AlterTable
ALTER TABLE "PairSushiSwap" DROP CONSTRAINT "PairSushiSwap_pkey",
ADD CONSTRAINT "PairSushiSwap_pkey" PRIMARY KEY ("address", "chainId");

-- AlterTable
ALTER TABLE "Token" DROP CONSTRAINT "Token_pkey",
ADD CONSTRAINT "Token_pkey" PRIMARY KEY ("id", "chainId");
