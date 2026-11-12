/*
  Warnings:

  - You are about to drop the `AREA_RISCO` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AREA_RISCO" DROP CONSTRAINT "AREA_RISCO_id_adm_fkey";

-- DropForeignKey
ALTER TABLE "AREA_RISCO" DROP CONSTRAINT "AREA_RISCO_id_predio_fkey";

-- DropTable
DROP TABLE "AREA_RISCO";

-- CreateTable
CREATE TABLE "AreaRisco" (
    "id_area" SERIAL NOT NULL,
    "id_predio" INTEGER NOT NULL,
    "id_adm" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "orientacao_seguranca" TEXT NOT NULL,
    "andar" INTEGER NOT NULL,
    "imagem_url" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ATIVO',

    CONSTRAINT "AreaRisco_pkey" PRIMARY KEY ("id_area")
);

-- AddForeignKey
ALTER TABLE "AreaRisco" ADD CONSTRAINT "AreaRisco_id_predio_fkey" FOREIGN KEY ("id_predio") REFERENCES "PREDIO"("id_predio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaRisco" ADD CONSTRAINT "AreaRisco_id_adm_fkey" FOREIGN KEY ("id_adm") REFERENCES "ADMINISTRADOR"("id_adm") ON DELETE RESTRICT ON UPDATE CASCADE;
