/*
  Warnings:

  - You are about to drop the column `id_reserva` on the `AVARIA` table. All the data in the column will be lost.
  - You are about to drop the column `id_turma` on the `PONTUACAO` table. All the data in the column will be lost.
  - The primary key for the `RESERVA_HORARIO` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `data` on the `RESERVA_HORARIO` table. All the data in the column will be lost.
  - You are about to drop the column `hora_fim` on the `RESERVA_HORARIO` table. All the data in the column will be lost.
  - You are about to drop the column `hora_inicio` on the `RESERVA_HORARIO` table. All the data in the column will be lost.
  - You are about to drop the column `id_horario` on the `RESERVA_HORARIO` table. All the data in the column will be lost.
  - You are about to drop the `AreaRisco` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[id_sala_horario,dt_reserva]` on the table `RESERVA_HORARIO` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_sala` to the `PONTUACAO` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dt_reserva` to the `RESERVA_HORARIO` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_sala_horario` to the `RESERVA_HORARIO` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foto` to the `SALA` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AVARIA" DROP CONSTRAINT "AVARIA_id_reserva_fkey";

-- DropForeignKey
ALTER TABLE "AreaRisco" DROP CONSTRAINT "AreaRisco_id_adm_fkey";

-- DropForeignKey
ALTER TABLE "AreaRisco" DROP CONSTRAINT "AreaRisco_id_predio_fkey";

-- DropForeignKey
ALTER TABLE "PONTUACAO" DROP CONSTRAINT "PONTUACAO_id_turma_fkey";

-- AlterTable
ALTER TABLE "AVARIA" DROP COLUMN "id_reserva";

-- AlterTable
ALTER TABLE "PONTUACAO" DROP COLUMN "id_turma",
ADD COLUMN     "id_sala" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "RESERVA" ADD COLUMN     "houve_avaria" BOOLEAN;

-- AlterTable
ALTER TABLE "RESERVA_HORARIO" DROP CONSTRAINT "RESERVA_HORARIO_pkey",
DROP COLUMN "data",
DROP COLUMN "hora_fim",
DROP COLUMN "hora_inicio",
DROP COLUMN "id_horario",
ADD COLUMN     "dt_reserva" DATE NOT NULL,
ADD COLUMN     "id_reserva_horario" SERIAL NOT NULL,
ADD COLUMN     "id_sala_horario" INTEGER NOT NULL,
ADD CONSTRAINT "RESERVA_HORARIO_pkey" PRIMARY KEY ("id_reserva_horario");

-- AlterTable
ALTER TABLE "SALA" ADD COLUMN     "foto" VARCHAR(255) NOT NULL;

-- DropTable
DROP TABLE "AreaRisco";

-- CreateTable
CREATE TABLE "AREA_RISCO" (
    "id_area" SERIAL NOT NULL,
    "id_predio" INTEGER NOT NULL,
    "id_adm" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "orientacao_seguranca" TEXT NOT NULL,
    "andar" INTEGER NOT NULL,
    "imagem_url" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ATIVO',

    CONSTRAINT "AREA_RISCO_pkey" PRIMARY KEY ("id_area")
);

-- CreateTable
CREATE TABLE "HORARIO" (
    "id_horario" SERIAL NOT NULL,
    "hora_inicio" VARCHAR(5) NOT NULL,
    "hora_fim" VARCHAR(5) NOT NULL,

    CONSTRAINT "HORARIO_pkey" PRIMARY KEY ("id_horario")
);

-- CreateTable
CREATE TABLE "SALA_HORARIO" (
    "id_sala_horario" SERIAL NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "id_horario" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SALA_HORARIO_pkey" PRIMARY KEY ("id_sala_horario")
);

-- CreateIndex
CREATE UNIQUE INDEX "SALA_HORARIO_id_sala_id_horario_dia_semana_key" ON "SALA_HORARIO"("id_sala", "id_horario", "dia_semana");

-- CreateIndex
CREATE UNIQUE INDEX "RESERVA_HORARIO_id_sala_horario_dt_reserva_key" ON "RESERVA_HORARIO"("id_sala_horario", "dt_reserva");

-- AddForeignKey
ALTER TABLE "AREA_RISCO" ADD CONSTRAINT "AREA_RISCO_id_predio_fkey" FOREIGN KEY ("id_predio") REFERENCES "PREDIO"("id_predio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AREA_RISCO" ADD CONSTRAINT "AREA_RISCO_id_adm_fkey" FOREIGN KEY ("id_adm") REFERENCES "ADMINISTRADOR"("id_adm") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SALA_HORARIO" ADD CONSTRAINT "SALA_HORARIO_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SALA_HORARIO" ADD CONSTRAINT "SALA_HORARIO_id_horario_fkey" FOREIGN KEY ("id_horario") REFERENCES "HORARIO"("id_horario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA_HORARIO" ADD CONSTRAINT "RESERVA_HORARIO_id_sala_horario_fkey" FOREIGN KEY ("id_sala_horario") REFERENCES "SALA_HORARIO"("id_sala_horario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PONTUACAO" ADD CONSTRAINT "PONTUACAO_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;
