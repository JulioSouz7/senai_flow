/*
  Warnings:

  - A unique constraint covering the columns `[nif]` on the table `ADMINISTRADOR` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nif` to the `ADMINISTRADOR` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ADMINISTRADOR" ADD COLUMN     "nif" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ADMINISTRADOR_nif_key" ON "ADMINISTRADOR"("nif");
