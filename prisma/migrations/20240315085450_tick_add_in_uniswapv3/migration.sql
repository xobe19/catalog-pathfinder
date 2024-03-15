/*
  Warnings:

  - Added the required column `tick` to the `PairV3` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PairV3" ADD COLUMN     "tick" INTEGER NOT NULL;
