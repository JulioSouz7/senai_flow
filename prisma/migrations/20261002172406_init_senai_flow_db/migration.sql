-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ADMINISTRADOR', 'DOCENTE', 'ALUNO');

-- CreateEnum
CREATE TYPE "StatusTroca" AS ENUM ('PENDENTE', 'ACEITA', 'RECUSADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusManutencao" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "SeveridadeRisco" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "StatusRelato" AS ENUM ('REGISTRADO', 'ANALISE', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "USUARIO" (
    "id_usuario" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "senha" VARCHAR(255) NOT NULL,
    "nif_cpf" VARCHAR(20) NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL,
    "primeiro_acesso" BOOLEAN NOT NULL DEFAULT true,
    "senha_alterada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "USUARIO_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "SALA" (
    "id_sala" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "bloco" VARCHAR(10) NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "qr_code" VARCHAR(255) NOT NULL,

    CONSTRAINT "SALA_pkey" PRIMARY KEY ("id_sala")
);

-- CreateTable
CREATE TABLE "TURMA" (
    "id_turma" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "periodo" VARCHAR(20) NOT NULL,
    "carga_horaria_semanal" INTEGER NOT NULL,

    CONSTRAINT "TURMA_pkey" PRIMARY KEY ("id_turma")
);

-- CreateTable
CREATE TABLE "TURMA_USUARIO" (
    "id_turma" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "TURMA_USUARIO_pkey" PRIMARY KEY ("id_turma","id_usuario")
);

-- CreateTable
CREATE TABLE "RESERVA" (
    "id_reserva" SERIAL NOT NULL,
    "dt_reserva" TIMESTAMP(3) NOT NULL,
    "hr_inicio" VARCHAR(5) NOT NULL,
    "hr_fim" VARCHAR(5) NOT NULL,
    "reserva_urgencia" BOOLEAN NOT NULL DEFAULT false,
    "id_turma" INTEGER NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_admin" INTEGER,

    CONSTRAINT "RESERVA_pkey" PRIMARY KEY ("id_reserva")
);

-- CreateTable
CREATE TABLE "EQUIPAMENTO" (
    "id_equipamento" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "nif" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "id_sala" INTEGER NOT NULL,

    CONSTRAINT "EQUIPAMENTO_pkey" PRIMARY KEY ("id_equipamento")
);

-- CreateTable
CREATE TABLE "MANUTENCAO" (
    "id_manutencao" SERIAL NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "dt_abertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dt_conclusao" TIMESTAMP(3),
    "status" "StatusManutencao" NOT NULL DEFAULT 'ABERTA',
    "id_equipamento" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "MANUTENCAO_pkey" PRIMARY KEY ("id_manutencao")
);

-- CreateTable
CREATE TABLE "TROCA_SALA" (
    "id_troca" SERIAL NOT NULL,
    "motivo" VARCHAR(255) NOT NULL,
    "dt_troca" TIMESTAMP(3) NOT NULL,
    "status" "StatusTroca" NOT NULL DEFAULT 'PENDENTE',
    "id_sala_origem" INTEGER NOT NULL,
    "id_sala_destino" INTEGER NOT NULL,
    "id_docente_solicitante" INTEGER NOT NULL,
    "id_docente_atendido" INTEGER NOT NULL,

    CONSTRAINT "TROCA_SALA_pkey" PRIMARY KEY ("id_troca")
);

-- CreateTable
CREATE TABLE "AREA_RISCO" (
    "id_risco" SERIAL NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "severidade" "SeveridadeRisco" NOT NULL,
    "bloco" VARCHAR(10) NOT NULL,
    "andar" INTEGER NOT NULL,
    "id_sala" INTEGER NOT NULL,

    CONSTRAINT "AREA_RISCO_pkey" PRIMARY KEY ("id_risco")
);

-- CreateTable
CREATE TABLE "RELATOS_SUGESTOES" (
    "id_relato" SERIAL NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "dt_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusRelato" NOT NULL DEFAULT 'REGISTRADO',
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "RELATOS_SUGESTOES_pkey" PRIMARY KEY ("id_relato")
);

-- CreateTable
CREATE TABLE "PONTUACAO_TURMA" (
    "id_pontuaca" SERIAL NOT NULL,
    "pontos" INTEGER NOT NULL,
    "dt_atribuicao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_turma" INTEGER NOT NULL,

    CONSTRAINT "PONTUACAO_TURMA_pkey" PRIMARY KEY ("id_pontuaca")
);

-- CreateTable
CREATE TABLE "HISTORICO_SENHA" (
    "id_historico" SERIAL NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "dt_alteracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "HISTORICO_SENHA_pkey" PRIMARY KEY ("id_historico")
);

-- CreateIndex
CREATE UNIQUE INDEX "USUARIO_email_key" ON "USUARIO"("email");

-- CreateIndex
CREATE UNIQUE INDEX "USUARIO_nif_cpf_key" ON "USUARIO"("nif_cpf");

-- CreateIndex
CREATE UNIQUE INDEX "EQUIPAMENTO_nif_key" ON "EQUIPAMENTO"("nif");

-- AddForeignKey
ALTER TABLE "TURMA_USUARIO" ADD CONSTRAINT "TURMA_USUARIO_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "TURMA"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TURMA_USUARIO" ADD CONSTRAINT "TURMA_USUARIO_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA" ADD CONSTRAINT "RESERVA_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "TURMA"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA" ADD CONSTRAINT "RESERVA_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA" ADD CONSTRAINT "RESERVA_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA" ADD CONSTRAINT "RESERVA_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "USUARIO"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EQUIPAMENTO" ADD CONSTRAINT "EQUIPAMENTO_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MANUTENCAO" ADD CONSTRAINT "MANUTENCAO_id_equipamento_fkey" FOREIGN KEY ("id_equipamento") REFERENCES "EQUIPAMENTO"("id_equipamento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MANUTENCAO" ADD CONSTRAINT "MANUTENCAO_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TROCA_SALA" ADD CONSTRAINT "TROCA_SALA_id_sala_origem_fkey" FOREIGN KEY ("id_sala_origem") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TROCA_SALA" ADD CONSTRAINT "TROCA_SALA_id_sala_destino_fkey" FOREIGN KEY ("id_sala_destino") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TROCA_SALA" ADD CONSTRAINT "TROCA_SALA_id_docente_solicitante_fkey" FOREIGN KEY ("id_docente_solicitante") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TROCA_SALA" ADD CONSTRAINT "TROCA_SALA_id_docente_atendido_fkey" FOREIGN KEY ("id_docente_atendido") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AREA_RISCO" ADD CONSTRAINT "AREA_RISCO_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RELATOS_SUGESTOES" ADD CONSTRAINT "RELATOS_SUGESTOES_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PONTUACAO_TURMA" ADD CONSTRAINT "PONTUACAO_TURMA_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "TURMA"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HISTORICO_SENHA" ADD CONSTRAINT "HISTORICO_SENHA_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
