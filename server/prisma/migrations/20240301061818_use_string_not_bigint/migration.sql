/*
  Warnings:

  - Made the column `token0Reserve` on table `Pair` required. This step will fail if there are existing NULL values in that column.
  - Made the column `token1Reserve` on table `Pair` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Pair" ALTER COLUMN "token0Reserve" SET NOT NULL,
ALTER COLUMN "token0Reserve" SET DATA TYPE TEXT,
ALTER COLUMN "token1Reserve" SET NOT NULL,
ALTER COLUMN "token1Reserve" SET DATA TYPE TEXT;
