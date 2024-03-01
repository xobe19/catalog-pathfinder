/*
  Warnings:

  - You are about to drop the column `index` on the `Pair` table. All the data in the column will be lost.
  - You are about to drop the column `decimals` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Token` table. All the data in the column will be lost.
  - You are about to drop the column `symbol` on the `Token` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Pair_index_key";

-- AlterTable
ALTER TABLE "Pair" DROP COLUMN "index";

-- AlterTable
ALTER TABLE "Token" DROP COLUMN "decimals",
DROP COLUMN "name",
DROP COLUMN "symbol";
