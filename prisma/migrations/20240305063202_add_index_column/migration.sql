/*
  Warnings:

  - The primary key for the `Pair` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `PairMar1` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[index]` on the table `Pair` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[address]` on the table `Pair` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `index` to the `Pair` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pair" DROP CONSTRAINT "Pair_pkey",
ADD COLUMN     "index" INTEGER NOT NULL,
ADD CONSTRAINT "Pair_pkey" PRIMARY KEY ("index");

-- DropTable
DROP TABLE "PairMar1";

-- CreateIndex
CREATE UNIQUE INDEX "Pair_index_key" ON "Pair"("index");

-- CreateIndex
CREATE UNIQUE INDEX "Pair_address_key" ON "Pair"("address");
