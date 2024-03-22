/*
  Warnings:

  - The primary key for the `Pair` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `index` on the `Pair` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Pair_address_key";

-- DropIndex
DROP INDEX "Pair_index_key";

-- AlterTable
ALTER TABLE "Pair" DROP CONSTRAINT "Pair_pkey",
DROP COLUMN "index",
ADD CONSTRAINT "Pair_pkey" PRIMARY KEY ("address");
