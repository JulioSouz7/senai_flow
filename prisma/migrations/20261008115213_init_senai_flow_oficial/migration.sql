-- CreateTable
CREATE TABLE "USUARIO" (
    "id_usuario" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha" VARCHAR(100) NOT NULL,
    "senha_alterada" BOOLEAN NOT NULL DEFAULT false,
    "perfil" VARCHAR(30) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ATIVO',

    CONSTRAINT "USUARIO_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "DOCENTE" (
    "id_docente" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nif" VARCHAR(30) NOT NULL,

    CONSTRAINT "DOCENTE_pkey" PRIMARY KEY ("id_docente")
);

-- CreateTable
CREATE TABLE "ALUNO" (
    "id_aluno" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "matricula" VARCHAR(30) NOT NULL,
    "situacao" VARCHAR(30) NOT NULL DEFAULT 'MATRICULADO',
    "id_turma" INTEGER NOT NULL,

    CONSTRAINT "ALUNO_pkey" PRIMARY KEY ("id_aluno")
);

-- CreateTable
CREATE TABLE "ADMINISTRADOR" (
    "id_adm" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "ADMINISTRADOR_pkey" PRIMARY KEY ("id_adm")
);

-- CreateTable
CREATE TABLE "PREDIO" (
    "id_predio" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,

    CONSTRAINT "PREDIO_pkey" PRIMARY KEY ("id_predio")
);

-- CreateTable
CREATE TABLE "SALA" (
    "id_sala" SERIAL NOT NULL,
    "id_predio" INTEGER NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "qr_code" VARCHAR(255) NOT NULL,

    CONSTRAINT "SALA_pkey" PRIMARY KEY ("id_sala")
);

-- CreateTable
CREATE TABLE "EQUIPAMENTO" (
    "id_equipamento" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(255),
    "nif" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL',

    CONSTRAINT "EQUIPAMENTO_pkey" PRIMARY KEY ("id_equipamento")
);

-- CreateTable
CREATE TABLE "SALA_EQUIPAMENTO" (
    "id_sala" INTEGER NOT NULL,
    "id_equipamento" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "SALA_EQUIPAMENTO_pkey" PRIMARY KEY ("id_sala","id_equipamento")
);

-- CreateTable
CREATE TABLE "AREA_RISCO" (
    "id_area" SERIAL NOT NULL,
    "id_predio" INTEGER NOT NULL,
    "id_adm" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "orientacao_seguranca" VARCHAR(255) NOT NULL,
    "andar" INTEGER NOT NULL,

    CONSTRAINT "AREA_RISCO_pkey" PRIMARY KEY ("id_area")
);

-- CreateTable
CREATE TABLE "TURMA" (
    "id_turma" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "curso" VARCHAR(100) NOT NULL,
    "qtd_alunos" INTEGER NOT NULL DEFAULT 0,
    "carga_horaria_semanal" INTEGER NOT NULL,

    CONSTRAINT "TURMA_pkey" PRIMARY KEY ("id_turma")
);

-- CreateTable
CREATE TABLE "DOCENTE_TURMA" (
    "id_docente" INTEGER NOT NULL,
    "id_turma" INTEGER NOT NULL,

    CONSTRAINT "DOCENTE_TURMA_pkey" PRIMARY KEY ("id_docente","id_turma")
);

-- CreateTable
CREATE TABLE "RESERVA" (
    "id_reserva" SERIAL NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "id_turma" INTEGER NOT NULL,
    "id_admin" INTEGER,
    "tipo" VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    "dt_solicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dt_validacao" TIMESTAMP(3),
    "justificativa_urgencia" VARCHAR(255),
    "id_reserva_urgencia" INTEGER,
    "dt_encerramento" TIMESTAMP(3),
    "sala_em_ordem" BOOLEAN,
    "obs_encerramento" VARCHAR(255),

    CONSTRAINT "RESERVA_pkey" PRIMARY KEY ("id_reserva")
);

-- CreateTable
CREATE TABLE "RESERVA_DOCENTE" (
    "id_reserva_docente" SERIAL NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "id_docente" INTEGER NOT NULL,

    CONSTRAINT "RESERVA_DOCENTE_pkey" PRIMARY KEY ("id_reserva_docente")
);

-- CreateTable
CREATE TABLE "RESERVA_HORARIO" (
    "id_horario" SERIAL NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fim" TIME NOT NULL,

    CONSTRAINT "RESERVA_HORARIO_pkey" PRIMARY KEY ("id_horario")
);

-- CreateTable
CREATE TABLE "TROCA_SALA" (
    "id_troca" SERIAL NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "id_sala_origem" INTEGER NOT NULL,
    "id_sala_destino" INTEGER NOT NULL,
    "id_docente_solicitante" INTEGER,
    "id_coordenador" INTEGER,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    "motivo" VARCHAR(255) NOT NULL,
    "dt_troca" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TROCA_SALA_pkey" PRIMARY KEY ("id_troca")
);

-- CreateTable
CREATE TABLE "PONTUACAO" (
    "id_pontuacao" SERIAL NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "id_turma" INTEGER NOT NULL,
    "pontos" INTEGER NOT NULL,
    "semestre_letivo" VARCHAR(20) NOT NULL,

    CONSTRAINT "PONTUACAO_pkey" PRIMARY KEY ("id_pontuacao")
);

-- CreateTable
CREATE TABLE "SOLICITACAO_EQUIPAMENTO" (
    "id_solicitacao" SERIAL NOT NULL,
    "id_reserva" INTEGER NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_admin_analise" INTEGER,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    "dt_solicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dt_resposta" TIMESTAMP(3),

    CONSTRAINT "SOLICITACAO_EQUIPAMENTO_pkey" PRIMARY KEY ("id_solicitacao")
);

-- CreateTable
CREATE TABLE "ITEM_SOLICITACAO" (
    "id_item_solicitacao" SERIAL NOT NULL,
    "id_solicitacao" INTEGER NOT NULL,
    "id_equipamento" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "ITEM_SOLICITACAO_pkey" PRIMARY KEY ("id_item_solicitacao")
);

-- CreateTable
CREATE TABLE "AVARIA" (
    "id_avaria" SERIAL NOT NULL,
    "id_docente" INTEGER NOT NULL,
    "id_sala" INTEGER NOT NULL,
    "id_equipamento" INTEGER,
    "id_reserva" INTEGER,
    "descricao" VARCHAR(255) NOT NULL,
    "foto" VARCHAR(255) NOT NULL,
    "gravidade" VARCHAR(30) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'ENCAMINHADO',

    CONSTRAINT "AVARIA_pkey" PRIMARY KEY ("id_avaria")
);

-- CreateTable
CREATE TABLE "COMUNICADO" (
    "id_comunicado" SERIAL NOT NULL,
    "id_adm" INTEGER NOT NULL,
    "id_turma" INTEGER,
    "id_reserva" INTEGER,
    "titulo" VARCHAR(255) NOT NULL,
    "conteudo" VARCHAR(255) NOT NULL,
    "abrangencia" VARCHAR(20) NOT NULL,
    "publico_alvo" VARCHAR(255),
    "dt_publicacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "COMUNICADO_pkey" PRIMARY KEY ("id_comunicado")
);

-- CreateTable
CREATE TABLE "RELATOS_SUGESTOES" (
    "id_relato" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "dt_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prazo_resposta" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    "id_admin" INTEGER,
    "resposta" VARCHAR(255),
    "encaminhada_corporativo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RELATOS_SUGESTOES_pkey" PRIMARY KEY ("id_relato")
);

-- CreateTable
CREATE TABLE "CHAMADO_SUPORTE" (
    "id_chamado" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_admin_resp" INTEGER,
    "assunto" VARCHAR(255) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ABERTO',
    "dt_abertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CHAMADO_SUPORTE_pkey" PRIMARY KEY ("id_chamado")
);

-- CreateTable
CREATE TABLE "CHAMADO_HISTORICO" (
    "id_historico" SERIAL NOT NULL,
    "id_chamado" INTEGER NOT NULL,
    "id_admin_status" INTEGER NOT NULL,
    "observacao" VARCHAR(255),
    "dt_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CHAMADO_HISTORICO_pkey" PRIMARY KEY ("id_historico")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id_faq" SERIAL NOT NULL,
    "pergunta" VARCHAR(255) NOT NULL,
    "resposta" VARCHAR(255) NOT NULL,
    "categoria" VARCHAR(50),

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id_faq")
);

-- CreateIndex
CREATE UNIQUE INDEX "USUARIO_email_key" ON "USUARIO"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DOCENTE_id_usuario_key" ON "DOCENTE"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "DOCENTE_nif_key" ON "DOCENTE"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "ALUNO_id_usuario_key" ON "ALUNO"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "ALUNO_matricula_key" ON "ALUNO"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "ADMINISTRADOR_id_usuario_key" ON "ADMINISTRADOR"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "SALA_qr_code_key" ON "SALA"("qr_code");

-- CreateIndex
CREATE UNIQUE INDEX "EQUIPAMENTO_nif_key" ON "EQUIPAMENTO"("nif");

-- CreateIndex
CREATE UNIQUE INDEX "RESERVA_DOCENTE_id_reserva_id_docente_key" ON "RESERVA_DOCENTE"("id_reserva", "id_docente");

-- CreateIndex
CREATE UNIQUE INDEX "PONTUACAO_id_reserva_key" ON "PONTUACAO"("id_reserva");

-- AddForeignKey
ALTER TABLE "DOCENTE" ADD CONSTRAINT "DOCENTE_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ALUNO" ADD CONSTRAINT "ALUNO_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ALUNO" ADD CONSTRAINT "ALUNO_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "TURMA"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ADMINISTRADOR" ADD CONSTRAINT "ADMINISTRADOR_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SALA" ADD CONSTRAINT "SALA_id_predio_fkey" FOREIGN KEY ("id_predio") REFERENCES "PREDIO"("id_predio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SALA_EQUIPAMENTO" ADD CONSTRAINT "SALA_EQUIPAMENTO_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SALA_EQUIPAMENTO" ADD CONSTRAINT "SALA_EQUIPAMENTO_id_equipamento_fkey" FOREIGN KEY ("id_equipamento") REFERENCES "EQUIPAMENTO"("id_equipamento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AREA_RISCO" ADD CONSTRAINT "AREA_RISCO_id_predio_fkey" FOREIGN KEY ("id_predio") REFERENCES "PREDIO"("id_predio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AREA_RISCO" ADD CONSTRAINT "AREA_RISCO_id_adm_fkey" FOREIGN KEY ("id_adm") REFERENCES "ADMINISTRADOR"("id_adm") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DOCENTE_TURMA" ADD CONSTRAINT "DOCENTE_TURMA_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "DOCENTE"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DOCENTE_TURMA" ADD CONSTRAINT "DOCENTE_TURMA_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "TURMA"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA" ADD CONSTRAINT "RESERVA_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA" ADD CONSTRAINT "RESERVA_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "TURMA"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA" ADD CONSTRAINT "RESERVA_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "ADMINISTRADOR"("id_adm") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA" ADD CONSTRAINT "RESERVA_id_reserva_urgencia_fkey" FOREIGN KEY ("id_reserva_urgencia") REFERENCES "RESERVA"("id_reserva") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA_DOCENTE" ADD CONSTRAINT "RESERVA_DOCENTE_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "RESERVA"("id_reserva") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA_DOCENTE" ADD CONSTRAINT "RESERVA_DOCENTE_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "DOCENTE"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RESERVA_HORARIO" ADD CONSTRAINT "RESERVA_HORARIO_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "RESERVA"("id_reserva") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TROCA_SALA" ADD CONSTRAINT "TROCA_SALA_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "RESERVA"("id_reserva") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TROCA_SALA" ADD CONSTRAINT "TROCA_SALA_id_sala_origem_fkey" FOREIGN KEY ("id_sala_origem") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TROCA_SALA" ADD CONSTRAINT "TROCA_SALA_id_sala_destino_fkey" FOREIGN KEY ("id_sala_destino") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TROCA_SALA" ADD CONSTRAINT "TROCA_SALA_id_docente_solicitante_fkey" FOREIGN KEY ("id_docente_solicitante") REFERENCES "DOCENTE"("id_docente") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TROCA_SALA" ADD CONSTRAINT "TROCA_SALA_id_coordenador_fkey" FOREIGN KEY ("id_coordenador") REFERENCES "ADMINISTRADOR"("id_adm") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PONTUACAO" ADD CONSTRAINT "PONTUACAO_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "RESERVA"("id_reserva") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PONTUACAO" ADD CONSTRAINT "PONTUACAO_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "TURMA"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOLICITACAO_EQUIPAMENTO" ADD CONSTRAINT "SOLICITACAO_EQUIPAMENTO_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "RESERVA"("id_reserva") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOLICITACAO_EQUIPAMENTO" ADD CONSTRAINT "SOLICITACAO_EQUIPAMENTO_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "DOCENTE"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SOLICITACAO_EQUIPAMENTO" ADD CONSTRAINT "SOLICITACAO_EQUIPAMENTO_id_admin_analise_fkey" FOREIGN KEY ("id_admin_analise") REFERENCES "ADMINISTRADOR"("id_adm") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITEM_SOLICITACAO" ADD CONSTRAINT "ITEM_SOLICITACAO_id_solicitacao_fkey" FOREIGN KEY ("id_solicitacao") REFERENCES "SOLICITACAO_EQUIPAMENTO"("id_solicitacao") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ITEM_SOLICITACAO" ADD CONSTRAINT "ITEM_SOLICITACAO_id_equipamento_fkey" FOREIGN KEY ("id_equipamento") REFERENCES "EQUIPAMENTO"("id_equipamento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AVARIA" ADD CONSTRAINT "AVARIA_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "DOCENTE"("id_docente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AVARIA" ADD CONSTRAINT "AVARIA_id_sala_fkey" FOREIGN KEY ("id_sala") REFERENCES "SALA"("id_sala") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AVARIA" ADD CONSTRAINT "AVARIA_id_equipamento_fkey" FOREIGN KEY ("id_equipamento") REFERENCES "EQUIPAMENTO"("id_equipamento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AVARIA" ADD CONSTRAINT "AVARIA_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "RESERVA"("id_reserva") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COMUNICADO" ADD CONSTRAINT "COMUNICADO_id_adm_fkey" FOREIGN KEY ("id_adm") REFERENCES "ADMINISTRADOR"("id_adm") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COMUNICADO" ADD CONSTRAINT "COMUNICADO_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "TURMA"("id_turma") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "COMUNICADO" ADD CONSTRAINT "COMUNICADO_id_reserva_fkey" FOREIGN KEY ("id_reserva") REFERENCES "RESERVA"("id_reserva") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RELATOS_SUGESTOES" ADD CONSTRAINT "RELATOS_SUGESTOES_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RELATOS_SUGESTOES" ADD CONSTRAINT "RELATOS_SUGESTOES_id_admin_fkey" FOREIGN KEY ("id_admin") REFERENCES "ADMINISTRADOR"("id_adm") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHAMADO_SUPORTE" ADD CONSTRAINT "CHAMADO_SUPORTE_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "USUARIO"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHAMADO_SUPORTE" ADD CONSTRAINT "CHAMADO_SUPORTE_id_admin_resp_fkey" FOREIGN KEY ("id_admin_resp") REFERENCES "ADMINISTRADOR"("id_adm") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHAMADO_HISTORICO" ADD CONSTRAINT "CHAMADO_HISTORICO_id_chamado_fkey" FOREIGN KEY ("id_chamado") REFERENCES "CHAMADO_SUPORTE"("id_chamado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CHAMADO_HISTORICO" ADD CONSTRAINT "CHAMADO_HISTORICO_id_admin_status_fkey" FOREIGN KEY ("id_admin_status") REFERENCES "ADMINISTRADOR"("id_adm") ON DELETE RESTRICT ON UPDATE CASCADE;
