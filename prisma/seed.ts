// SENAI Flow — Seed Data
// Popula o banco com dados fake para viabilizar os testes da POC via Insomnia.
//
// Gerado a partir do schema.prisma mais recente (com Administrador.nif, Sala.foto,
// AreaRisco.imagem_url/status, Reserva.houve_avaria, os novos modelos HORARIO/SALA_HORARIO
// e o ReservaHorario reestruturado para referenciar sala_horario + dt_reserva, Pontuacao
// ligada a Sala em vez de Turma, Avaria sem id_reserva, e RelatoHistorico substituindo o
// antigo ChamadoHistorico).
//
// Rodar com: npm run seed  (ver script "seed" em package.json / bloco "prisma.seed")
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SENHA_PADRAO = "SenaiFlow@2026";

async function main() {
  console.log("Iniciando seed do SENAI Flow...");

  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

  // ===================== 1. USUÁRIOS & PERFIS =====================

  // --- Administrador ---
  const usuarioAdmin = await prisma.usuario.create({
    data: {
      nome: "Eduardo Nunes Gracio",
      email: "eduardo.gracio@senaiflow.com",
      senha: senhaHash,
      perfil: "ADMINISTRADOR",
      status: "ATIVO",
    },
  });

  const admin = await prisma.administrador.create({
    data: {
      id_usuario: usuarioAdmin.id_usuario,
      nif: "ADM-0001",
    },
  });

  // --- Docentes ---
  const usuarioJulio = await prisma.usuario.create({
    data: {
      nome: "Julio de Souza Gonçalves",
      email: "julio.goncalves@senaiflow.com",
      senha: senhaHash,
      perfil: "DOCENTE",
      status: "ATIVO",
    },
  });
  const docenteJulio = await prisma.docente.create({
    data: { id_usuario: usuarioJulio.id_usuario, nif: "DOC-0001" },
  });

  const usuarioFernanda = await prisma.usuario.create({
    data: {
      nome: "Fernanda Ribeiro",
      email: "fernanda.ribeiro@senaiflow.com",
      senha: senhaHash,
      perfil: "DOCENTE",
      status: "ATIVO",
    },
  });
  const docenteFernanda = await prisma.docente.create({
    data: { id_usuario: usuarioFernanda.id_usuario, nif: "DOC-0002" },
  });

  // --- Turma (precisa existir antes dos Alunos, que referenciam id_turma) ---
  const turma = await prisma.turma.create({
    data: {
      nome: "DS3A",
      curso: "Técnico em Desenvolvimento de Sistemas",
      qtd_alunos: 3,
      carga_horaria_semanal: 20,
    },
  });

  await prisma.docenteTurma.createMany({
    data: [
      { id_docente: docenteJulio.id_docente, id_turma: turma.id_turma },
      { id_docente: docenteFernanda.id_docente, id_turma: turma.id_turma },
    ],
  });

  // --- Alunos ---
  const usuarioLucas = await prisma.usuario.create({
    data: {
      nome: "Lucas Andrade",
      email: "lucas.andrade@senaiflow.com",
      senha: senhaHash,
      perfil: "ALUNO",
      status: "ATIVO",
    },
  });
  const alunoLucas = await prisma.aluno.create({
    data: {
      id_usuario: usuarioLucas.id_usuario,
      matricula: "2026001",
      situacao: "MATRICULADO",
      id_turma: turma.id_turma,
    },
  });

  const usuarioBeatriz = await prisma.usuario.create({
    data: {
      nome: "Beatriz Lima",
      email: "beatriz.lima@senaiflow.com",
      senha: senhaHash,
      perfil: "ALUNO",
      status: "ATIVO",
    },
  });
  await prisma.aluno.create({
    data: {
      id_usuario: usuarioBeatriz.id_usuario,
      matricula: "2026002",
      situacao: "MATRICULADO",
      id_turma: turma.id_turma,
    },
  });

  // Aluno FORMADO — exercita a RN37 (ex-aluno deve ter o acesso bloqueado).
  const usuarioRafael = await prisma.usuario.create({
    data: {
      nome: "Rafael Souza",
      email: "rafael.souza@senaiflow.com",
      senha: senhaHash,
      perfil: "ALUNO",
      status: "BLOQUEADO", // RN37: ex-aluno/formado deve ser bloqueado imediatamente
    },
  });
  await prisma.aluno.create({
    data: {
      id_usuario: usuarioRafael.id_usuario,
      matricula: "2025087",
      situacao: "FORMADO",
      id_turma: turma.id_turma,
    },
  });

  // ===================== 2. INFRAESTRUTURA & ESPAÇOS =====================

  const predio = await prisma.predio.create({ data: { nome: "Bloco D" } });

  const salaD101 = await prisma.sala.create({
    data: {
      id_predio: predio.id_predio,
      nome: "D101",
      capacidade: 35,
      ativa: true,
      qr_code: "QR-D101-001",
      foto: "/uploads/salas/d101.jpg",
    },
  });

  const salaD102 = await prisma.sala.create({
    data: {
      id_predio: predio.id_predio,
      nome: "D102",
      capacidade: 30,
      ativa: true,
      qr_code: "QR-D102-001",
      foto: "/uploads/salas/d102.jpg",
    },
  });

  const salaD103 = await prisma.sala.create({
    data: {
      id_predio: predio.id_predio,
      nome: "D103",
      capacidade: 25,
      ativa: true,
      qr_code: "QR-D103-001",
      foto: "/uploads/salas/d103.jpg",
    },
  });

  const equipProjetor = await prisma.equipamento.create({
    data: { nome: "Projetor Epson X200", descricao: "Projetor multimídia", nif: "EQ-0001", status: "DISPONIVEL" },
  });
  const equipNotebook = await prisma.equipamento.create({
    data: { nome: "Notebook Dell Vostro", descricao: "Notebook para apoio em aula", nif: "EQ-0002", status: "DISPONIVEL" },
  });
  const equipCaixaSom = await prisma.equipamento.create({
    data: { nome: "Caixa de Som JBL", descricao: "Caixa de som portátil", nif: "EQ-0003", status: "DISPONIVEL" },
  });
  const equipArCondicionado = await prisma.equipamento.create({
    data: { nome: "Ar-condicionado Split", descricao: "Climatização da sala", nif: "EQ-0004", status: "MANUTENCAO" },
  });

  await prisma.salaEquipamento.createMany({
    data: [
      { id_sala: salaD101.id_sala, id_equipamento: equipProjetor.id_equipamento, quantidade: 1 },
      { id_sala: salaD101.id_sala, id_equipamento: equipArCondicionado.id_equipamento, quantidade: 1 },
      { id_sala: salaD102.id_sala, id_equipamento: equipCaixaSom.id_equipamento, quantidade: 1 },
    ],
  });

  await prisma.areaRisco.create({
    data: {
      id_predio: predio.id_predio,
      id_adm: admin.id_adm,
      nome: "Rota de fuga — corredor Bloco D",
      tipo: "ROTA_DE_FUGA",
      orientacao_seguranca:
        "Em caso de incêndio ou emergência, dirija-se à escada da ala leste e siga até o ponto de encontro no estacionamento. Rota possui sinalização fotoluminescente e rampa de acessibilidade.",
      andar: 1,
      imagem_url: "/uploads/mapas/bloco-d-rota-fuga.png",
      status: "ATIVO",
    },
  });

  // ===================== 3. GRADE DE HORÁRIOS =====================
  // HORARIO = catálogo de períodos de aula; SALA_HORARIO = grade semanal (quais salas
  // abrem em quais períodos/dias); RESERVA_HORARIO liga uma reserva a um SALA_HORARIO
  // numa data específica.

  const horario1 = await prisma.horario.create({ data: { hora_inicio: "07:30", hora_fim: "09:10" } });
  const horario2 = await prisma.horario.create({ data: { hora_inicio: "09:10", hora_fim: "10:50" } });
  const horario3 = await prisma.horario.create({ data: { hora_inicio: "13:30", hora_fim: "15:10" } });

  // dia_semana: 1=Segunda, 2=Terça, ..., 6=Sábado
  const salaHorarioD101Seg1 = await prisma.salaHorario.create({
    data: { id_sala: salaD101.id_sala, id_horario: horario1.id_horario, dia_semana: 1, ativo: true },
  });
  const salaHorarioD101Ter2 = await prisma.salaHorario.create({
    data: { id_sala: salaD101.id_sala, id_horario: horario2.id_horario, dia_semana: 2, ativo: true },
  });
  const salaHorarioD102Seg3 = await prisma.salaHorario.create({
    data: { id_sala: salaD102.id_sala, id_horario: horario3.id_horario, dia_semana: 1, ativo: true },
  });

  // ===================== 4. RESERVAS & AGENDAMENTOS =====================

  // Reserva 1 — já ENCERRADA (sala devolvida em ordem), usada para gerar Pontuação.
  const reserva1 = await prisma.reserva.create({
    data: {
      id_sala: salaD101.id_sala,
      id_turma: turma.id_turma,
      id_admin: admin.id_adm,
      tipo: "NORMAL",
      status: "ENCERRADA",
      dt_validacao: new Date("2026-10-19T08:00:00"),
      dt_encerramento: new Date("2026-10-19T09:15:00"),
      sala_em_ordem: true,
      houve_avaria: false,
      obs_encerramento: "Sala devolvida em ordem, sem avarias.",
    },
  });
  await prisma.reservaDocente.create({
    data: { id_reserva: reserva1.id_reserva, id_docente: docenteJulio.id_docente },
  });
  await prisma.reservaHorario.create({
    data: {
      id_reserva: reserva1.id_reserva,
      id_sala_horario: salaHorarioD101Seg1.id_sala_horario,
      dt_reserva: new Date("2026-10-19"),
    },
  });
  await prisma.pontuacao.create({
    data: {
      id_reserva: reserva1.id_reserva,
      id_sala: salaD101.id_sala,
      pontos: 10,
      semestre_letivo: "2026/2",
    },
  });

  // Reserva 2 — CONFIRMADA, próxima semana, sala D101 no mesmo horário/dia (Segunda, 07:30),
  // é o "titular" da sala na disputa de urgência simulada pela Reserva 3 (cenário Pedro x Julio / RN08).
  const reserva2 = await prisma.reserva.create({
    data: {
      id_sala: salaD101.id_sala,
      id_turma: turma.id_turma,
      id_admin: admin.id_adm,
      tipo: "NORMAL",
      status: "CONFIRMADA",
      dt_validacao: new Date(),
    },
  });
  await prisma.reservaDocente.create({
    data: { id_reserva: reserva2.id_reserva, id_docente: docenteFernanda.id_docente },
  });
  await prisma.reservaHorario.create({
    data: {
      id_reserva: reserva2.id_reserva,
      id_sala_horario: salaHorarioD101Seg1.id_sala_horario,
      dt_reserva: new Date("2026-10-26"),
    },
  });

  // Reserva 3 — URGENCIA, PENDENTE: Julio contesta a sala da Reserva 2 (RN08) porque
  // nenhuma outra sala livre tem os equipamentos necessários para a aula prática.
  const reserva3 = await prisma.reserva.create({
    data: {
      id_sala: salaD101.id_sala,
      id_turma: turma.id_turma,
      tipo: "URGENCIA",
      status: "PENDENTE",
      justificativa_urgencia:
        "Aula prática de hoje depende do projetor e do ar-condicionado da D101; nenhuma outra sala livre possui os dois recursos.",
      id_reserva_urgencia: reserva2.id_reserva,
    },
  });
  await prisma.reservaDocente.create({
    data: { id_reserva: reserva3.id_reserva, id_docente: docenteJulio.id_docente },
  });

  // Troca de sala sugerida por um docente (RF19/RN32), ainda pendente de aceite mútuo + validação do ADM.
  await prisma.trocaSala.create({
    data: {
      id_reserva: reserva2.id_reserva,
      id_sala_origem: salaD101.id_sala,
      id_sala_destino: salaD102.id_sala,
      id_docente_solicitante: docenteFernanda.id_docente,
      status: "PENDENTE",
      motivo: "Turma cresceu e a D102 tem melhor acústica para a atividade de hoje.",
    },
  });

  // ===================== 5. SOLICITAÇÃO DE EQUIPAMENTOS =====================

  const solicitacao = await prisma.solicitacaoEquipamento.create({
    data: {
      id_docente: docenteFernanda.id_docente,
      id_admin_analise: admin.id_adm,
      id_reserva: reserva2.id_reserva,
      status: "EM ANÁLISE",
    },
  });
  await prisma.itemSolicitacao.create({
    data: {
      id_solicitacao: solicitacao.id_solicitacao,
      id_equipamento: equipNotebook.id_equipamento,
      quantidade: 1,
    },
  });

  // ===================== 6. OCORRÊNCIAS & MANUTENÇÃO =====================

  await prisma.avaria.create({
    data: {
      id_docente: docenteJulio.id_docente,
      id_sala: salaD101.id_sala,
      id_equipamento: equipArCondicionado.id_equipamento,
      descricao: "Ar-condicionado da sala D101 não está gelando e faz ruído alto ao ligar.",
      foto: "/uploads/avarias/d101-ar-condicionado.jpg",
      gravidade: "MEDIA",
      status: "ENCAMINHADO",
    },
  });

  // ===================== 7. COMUNICAÇÃO & SUPORTE =====================

  await prisma.comunicado.create({
    data: {
      id_adm: admin.id_adm,
      titulo: "Manutenção preventiva no Bloco D",
      conteudo: "Nos dias 25 e 26/10 haverá manutenção preventiva nos ares-condicionados do Bloco D.",
      abrangencia: "GERAL",
    },
  });
  await prisma.comunicado.create({
    data: {
      id_adm: admin.id_adm,
      id_turma: turma.id_turma,
      titulo: "Aula prática remarcada",
      conteudo: "A aula prática de quinta-feira foi remarcada para a sala D102.",
      abrangencia: "TURMA",
    },
  });

  const relato1 = await prisma.relatoSugestao.create({
    data: {
      id_usuario: usuarioLucas.id_usuario,
      tipo: "SUGESTAO",
      descricao: "Poderia ter tomadas extras perto das primeiras carteiras da sala D101.",
      prazo_resposta: new Date("2026-10-28"),
      status: "PENDENTE",
    },
  });
  const relato2 = await prisma.relatoSugestao.create({
    data: {
      id_usuario: usuarioFernanda.id_usuario,
      tipo: "RECLAMACAO",
      descricao: "O projetor da sala D103 está com a imagem desfocada há duas semanas.",
      prazo_resposta: new Date("2026-10-22"),
      status: "LIDO",
      id_admin: admin.id_adm,
      resposta: "Chamado técnico aberto junto ao fornecedor, previsão de conserto até sexta-feira.",
    },
  });
  await prisma.relatoHistorico.create({
    data: {
      id_relato: relato2.id_relato,
      id_admin_status: admin.id_adm,
      status: "LIDO",
    },
  });

  await prisma.chamadoSuporte.create({
    data: {
      id_usuario: usuarioLucas.id_usuario,
      id_admin_resp: admin.id_adm,
      assunto: "Não consigo acessar o QR code da sala",
      descricao: "Ao escanear o QR code da D101 o app fecha sozinho.",
      status: "EM_ANDAMENTO",
    },
  });

  await prisma.faq.createMany({
    data: [
      {
        pergunta: "Como faço para reservar uma sala?",
        resposta: "Acesse o módulo Reserva de Salas, escolha o horário disponível e confirme.",
        categoria: "Reservas",
      },
      {
        pergunta: "O que é uma reserva de urgência?",
        resposta:
          "É o fluxo usado quando não há sala livre com os recursos necessários (RN08); a administração avalia qual solicitação tem prioridade.",
        categoria: "Reservas",
      },
    ],
  });

  console.log("Seed concluído com sucesso.");
  console.log(`Login de teste (ADM): ${usuarioAdmin.email} / senha: ${SENHA_PADRAO}`);
  console.log(`Login de teste (DOCENTE): ${usuarioJulio.email} / senha: ${SENHA_PADRAO}`);
  console.log(`Login de teste (ALUNO): ${usuarioLucas.email} / senha: ${SENHA_PADRAO}`);
}

main()
  .catch((e) => {
    console.error("Erro ao rodar o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Para o script "npm run seed" funcionar, garanta que o package.json tenha:
// "prisma": { "seed": "ts-node prisma/seed.ts" }