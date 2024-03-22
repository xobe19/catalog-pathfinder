/*
  Warnings:

  - You are about to drop the column `tokensId` on the `Pair` table. All the data in the column will be lost.
  - You are about to drop the `PairToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `token0Address` to the `Pair` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token1Address` to the `Pair` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Pair" DROP CONSTRAINT "Pair_tokensId_fkey";

-- DropForeignKey
ALTER TABLE "PairToken" DROP CONSTRAINT "PairToken_token0Id_fkey";

-- DropForeignKey
ALTER TABLE "PairToken" DROP CONSTRAINT "PairToken_token1Id_fkey";

-- AlterTable
ALTER TABLE "Pair" DROP COLUMN "tokensId",
ADD COLUMN     "token0Address" TEXT NOT NULL,
ADD COLUMN     "token1Address" TEXT NOT NULL;

-- DropTable
DROP TABLE "PairToken";

-- DropTable
DROP TABLE "Token";
