/*
  Warnings:

  - Added the required column `token0Balance` to the `PairV3` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token1Balance` to the `PairV3` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PairV3" ADD COLUMN     "token0Balance" TEXT NOT NULL,
ADD COLUMN     "token1Balance" TEXT NOT NULL;
