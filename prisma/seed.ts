import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do SENAI Flow...");

  // 1. Limpeza de tabelas filhas / relacionamentos que apontam para outras tabelas
  await prisma.chamadoHistorico.deleteMany();
  await prisma.chamadoSuporte.deleteMany();
  await prisma.relatoSugestao.deleteMany();
  await prisma.comunicado.deleteMany();
  await prisma.avaria.deleteMany();
  await prisma.itemSolicitacao.deleteMany();
  await prisma.solicitacaoEquipamento.deleteMany();
  await prisma.pontuacao.deleteMany();
  await prisma.trocaSala.deleteMany();
  await prisma.reservaHorario.deleteMany();
  await prisma.reservaDocente.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.docenteTurma.deleteMany();

  // 2. IMPORTANTE: Deletar ALUNO antes de TURMA para liberar a Foreign Key!
  await prisma.aluno.deleteMany();
  await prisma.turma.deleteMany();

  // 3. Deletar infraestrutura e perfis restantes
  await prisma.areaRisco.deleteMany();
  await prisma.salaEquipamento.deleteMany();
  await prisma.equipamento.deleteMany();
  await prisma.sala.deleteMany();
  await prisma.predio.deleteMany();
  await prisma.administrador.deleteMany();
  await prisma.docente.deleteMany();
  await prisma.usuario.deleteMany();

  const senhaPadraoHash = await bcrypt.hash("1234", 10);

  // ---------------------- 1. USUÁRIOS & PERFIS ----------------------

  const usuarioAdmin = await prisma.usuario.create({
    data: {
      nome: "Eduardo Nunes Gracio",
      email: "eduardo.gracio@senai.br",
      senha: senhaPadraoHash,
      senha_alterada: true,
      perfil: "ADMINISTRADOR",
      status: "ATIVO",
    },
  });

  const usuarioJulio = await prisma.usuario.create({
    data: {
      nome: "Julio de Souza Gonçalves",
      email: "julio.goncalves@senai.br",
      senha: senhaPadraoHash,
      senha_alterada: true,
      perfil: "DOCENTE",
      status: "ATIVO",
    },
  });

  const usuarioFernanda = await prisma.usuario.create({
    data: {
      nome: "Fernanda Ribeiro",
      email: "fernanda.ribeiro@senai.br",
      senha: senhaPadraoHash,
      senha_alterada: true,
      perfil: "DOCENTE",
      status: "ATIVO",
    },
  });

  const usuarioLucas = await prisma.usuario.create({
    data: {
      nome: "Lucas Andrade",
      email: "lucas.andrade@aluno.senai.br",
      senha: senhaPadraoHash,
      senha_alterada: false,
      perfil: "ALUNO",
      status: "ATIVO",
    },
  });

  const usuarioBeatriz = await prisma.usuario.create({
    data: {
      nome: "Beatriz Lima",
      email: "beatriz.lima@aluno.senai.br",
      senha: senhaPadraoHash,
      senha_alterada: false,
      perfil: "ALUNO",
      status: "ATIVO",
    },
  });

  const usuarioRafael = await prisma.usuario.create({
    data: {
      nome: "Rafael Souza",
      email: "rafael.souza@aluno.senai.br",
      senha: senhaPadraoHash,
      senha_alterada: true,
      perfil: "ALUNO",
      status: "ATIVO",
    },
  });

  const admin = await prisma.administrador.create({
    data: { id_usuario: usuarioAdmin.id_usuario },
  });

  // ---------------------- 3. GESTÃO ACADÊMICA ----------------------

  const turmaDS301 = await prisma.turma.create({
    data: {
      nome: "DS301 - Noite",
      curso: "Desenvolvimento de Sistemas",
      qtd_alunos: 2,
      carga_horaria_semanal: 20,
    },
  });

  const turmaADM201 = await prisma.turma.create({
    data: {
      nome: "ADM201 - Manhã",
      curso: "Administração",
      qtd_alunos: 1,
      carga_horaria_semanal: 18,
    },
  });

  const docenteJulio = await prisma.docente.create({
    data: { id_usuario: usuarioJulio.id_usuario, nif: "DOC-0001" },
  });

  const docenteFernanda = await prisma.docente.create({
    data: { id_usuario: usuarioFernanda.id_usuario, nif: "DOC-0002" },
  });

  await prisma.aluno.create({
    data: {
      id_usuario: usuarioLucas.id_usuario,
      matricula: "2026DS0001",
      situacao: "MATRICULADO",
      id_turma: turmaDS301.id_turma,
    },
  });

  await prisma.aluno.create({
    data: {
      id_usuario: usuarioBeatriz.id_usuario,
      matricula: "2026DS0002",
      situacao: "MATRICULADO",
      id_turma: turmaDS301.id_turma,
    },
  });

  await prisma.aluno.create({
    data: {
      id_usuario: usuarioRafael.id_usuario,
      matricula: "2025ADM0099",
      situacao: "FORMADO", // ex-aluno, cobre a RN37 (bloqueio de ex-aluno)
      id_turma: turmaADM201.id_turma,
    },
  });

  await prisma.docenteTurma.create({
    data: { id_docente: docenteJulio.id_docente, id_turma: turmaDS301.id_turma },
  });

  await prisma.docenteTurma.create({
    data: { id_docente: docenteFernanda.id_docente, id_turma: turmaADM201.id_turma },
  });

  // ---------------------- 2. INFRAESTRUTURA & ESPAÇOS ----------------------

  const blocoD = await prisma.predio.create({ data: { nome: "Bloco D" } });

  const salaD101 = await prisma.sala.create({
    data: {
      id_predio: blocoD.id_predio,
      nome: "Sala D101",
      capacidade: 35,
      ativa: true,
      qr_code: "QR-SALA-D101-7F3A",
    },
  });

  const salaD102 = await prisma.sala.create({
    data: {
      id_predio: blocoD.id_predio,
      nome: "Sala D102",
      capacidade: 30,
      ativa: true,
      qr_code: "QR-SALA-D102-9B1C",
    },
  });

  const salaD103 = await prisma.sala.create({
    data: {
      id_predio: blocoD.id_predio,
      nome: "Sala D103",
      capacidade: 25,
      ativa: true,
      qr_code: "QR-SALA-D103-4E2D",
    },
  });

  const projetor = await prisma.equipamento.create({
    data: { nome: "Projetor Epson X200", descricao: "Projetor multimídia portátil", nif: "EQP-0001", status: "DISPONIVEL" },
  });

  const notebook = await prisma.equipamento.create({
    data: { nome: "Notebook Dell Latitude", descricao: "Notebook para apresentações", nif: "EQP-0002", status: "DISPONIVEL" },
  });

  const caixaSom = await prisma.equipamento.create({
    data: { nome: "Caixa de Som JBL", descricao: "Caixa de som bluetooth", nif: "EQP-0003", status: "DISPONIVEL" },
  });

  const roteador = await prisma.equipamento.create({
    data: { nome: "Roteador Wi-Fi TP-Link", descricao: "Roteador de backup para a sala", nif: "EQP-0004", status: "MANUTENCAO" },
  });

  await prisma.salaEquipamento.createMany({
    data: [
      { id_sala: salaD101.id_sala, id_equipamento: projetor.id_equipamento, quantidade: 1 },
      { id_sala: salaD101.id_sala, id_equipamento: caixaSom.id_equipamento, quantidade: 1 },
      { id_sala: salaD102.id_sala, id_equipamento: projetor.id_equipamento, quantidade: 1 },
      { id_sala: salaD103.id_sala, id_equipamento: notebook.id_equipamento, quantidade: 2 },
    ],
  });

  await prisma.areaRisco.createMany({
    data: [
      {
        id_predio: blocoD.id_predio,
        id_adm: admin.id_adm,
        nome: "Saída de emergência - corredor D",
        tipo: "ROTA_FUGA",
        orientacao_seguranca: "Manter corredor livre de obstáculos; ponto de encontro no pátio externo.",
        andar: 1,
      },
      {
        id_predio: blocoD.id_predio,
        id_adm: admin.id_adm,
        nome: "Rampa de acessibilidade - entrada D",
        tipo: "ACESSIBILIDADE",
        orientacao_seguranca: "Rampa com corrimão duplo; piso tátil instalado.",
        andar: 0,
      },
    ],
  });

  // ---------------------- 4. RESERVAS & AGENDAMENTOS ----------------------

  // Reserva já encerrada (usada para gerar pontuação)
  const reservaEncerrada = await prisma.reserva.create({
    data: {
      id_sala: salaD101.id_sala,
      id_turma: turmaDS301.id_turma,
      id_admin: admin.id_adm,
      tipo: "NORMAL",
      status: "ENCERRADA",
      dt_solicitacao: new Date("2026-09-28T10:00:00"),
      dt_validacao: new Date("2026-09-28T11:00:00"),
      dt_encerramento: new Date("2026-10-01T10:00:00"),
      sala_em_ordem: true,
    },
  });

  // Reserva confirmada de Fernanda (será desafiada pela reserva de urgência abaixo)
  const reservaFernanda = await prisma.reserva.create({
    data: {
      id_sala: salaD102.id_sala,
      id_turma: turmaADM201.id_turma,
      id_admin: admin.id_adm,
      tipo: "NORMAL",
      status: "CONFIRMADA",
      dt_solicitacao: new Date("2026-10-02T09:00:00"),
      dt_validacao: new Date("2026-10-02T10:00:00"),
    },
  });

  // Reserva de urgência — Julio desafia a sala confirmada da Fernanda (cenário RN08)
  const reservaUrgencia = await prisma.reserva.create({
    data: {
      id_sala: salaD102.id_sala,
      id_turma: turmaDS301.id_turma,
      tipo: "URGENCIA",
      status: "PENDENTE",
      dt_solicitacao: new Date("2026-10-08T07:30:00"),
      justificativa_urgencia:
        "Sala original indisponível por infiltração; aula de avaliação não pode ser remarcada.",
      id_reserva_urgencia: reservaFernanda.id_reserva,
    },
  });

  await prisma.reservaDocente.createMany({
    data: [
      { id_reserva: reservaEncerrada.id_reserva, id_docente: docenteJulio.id_docente },
      { id_reserva: reservaFernanda.id_reserva, id_docente: docenteFernanda.id_docente },
      { id_reserva: reservaUrgencia.id_reserva, id_docente: docenteJulio.id_docente },
    ],
  });

  await prisma.reservaHorario.createMany({
    data: [
      { id_reserva: reservaEncerrada.id_reserva, data: new Date("2026-10-01"), hora_inicio: new Date("1970-01-01T08:00:00"), hora_fim: new Date("1970-01-01T10:00:00") },
      { id_reserva: reservaFernanda.id_reserva, data: new Date("2026-10-10"), hora_inicio: new Date("1970-01-01T14:00:00"), hora_fim: new Date("1970-01-01T16:00:00") },
      { id_reserva: reservaUrgencia.id_reserva, data: new Date("2026-10-10"), hora_inicio: new Date("1970-01-01T14:00:00"), hora_fim: new Date("1970-01-01T16:00:00") },
    ],
  });

  // Sugestão de troca entre docentes (RN32) — ainda pendente de validação da coordenação
  await prisma.trocaSala.create({
    data: {
      id_reserva: reservaFernanda.id_reserva,
      id_sala_origem: salaD102.id_sala,
      id_sala_destino: salaD103.id_sala,
      id_docente_solicitante: docenteFernanda.id_docente,
      status: "PENDENTE",
      motivo: "Fernanda sugere troca para a Sala D103 por ter melhor acústica para a atividade.",
    },
  });

  await prisma.pontuacao.create({
    data: {
      id_reserva: reservaEncerrada.id_reserva,
      id_turma: turmaDS301.id_turma,
      pontos: 10,
      semestre_letivo: "2026-2",
    },
  });

  // ---------------------- 5. SOLICITAÇÃO DE EQUIPAMENTOS ----------------------

  const solicitacao = await prisma.solicitacaoEquipamento.create({
    data: {
      id_reserva: reservaEncerrada.id_reserva,
      id_docente: docenteJulio.id_docente,
      id_admin_analise: admin.id_adm,
      status: "APROVADA",
      dt_solicitacao: new Date("2026-09-27T15:00:00"),
      dt_resposta: new Date("2026-09-27T16:30:00"),
    },
  });

  await prisma.itemSolicitacao.create({
    data: {
      id_solicitacao: solicitacao.id_solicitacao,
      id_equipamento: projetor.id_equipamento,
      quantidade: 1,
    },
  });

  // ---------------------- 6. OCORRÊNCIAS & MANUTENÇÃO ----------------------

  await prisma.avaria.create({
    data: {
      id_docente: docenteJulio.id_docente,
      id_sala: salaD101.id_sala,
      id_equipamento: roteador.id_equipamento,
      id_reserva: reservaEncerrada.id_reserva,
      descricao: "Roteador Wi-Fi da sala não conecta à rede institucional desde a última aula.",
      foto: "/uploads/avarias/avaria-0001.jpg",
      gravidade: "MEDIA",
      status: "EM_ANALISE",
    },
  });

  // ---------------------- 7. COMUNICAÇÃO & SUPORTE ----------------------

  await prisma.comunicado.createMany({
    data: [
      {
        id_adm: admin.id_adm,
        titulo: "Manutenção programada no Bloco D",
        conteudo: "Manutenção elétrica agendada para o fim de semana; nenhuma aula será afetada.",
        abrangencia: "GERAL",
        publico_alvo: "Toda a instituição",
        dt_publicacao: new Date("2026-10-03T09:00:00"),
      },
      {
        id_adm: admin.id_adm,
        id_turma: turmaDS301.id_turma,
        id_reserva: reservaEncerrada.id_reserva,
        titulo: "Sala confirmada para avaliação",
        conteudo: "A reserva da turma DS301 para a avaliação prática foi confirmada na Sala D101.",
        abrangencia: "TURMA",
        publico_alvo: "Turma DS301",
        dt_publicacao: new Date("2026-09-28T11:05:00"),
      },
    ],
  });

  await prisma.relatoSugestao.createMany({
    data: [
      {
        id_usuario: usuarioLucas.id_usuario,
        tipo: "SUGESTAO",
        descricao: "Sugiro adicionar tomadas extras na Sala D101 para carregar notebooks durante a aula.",
        dt_envio: new Date("2026-10-01T08:20:00"),
        prazo_resposta: new Date("2026-10-06"),
        status: "PENDENTE",
      },
      {
        id_usuario: usuarioBeatriz.id_usuario,
        tipo: "RECLAMACAO",
        descricao: "O ar-condicionado da Sala D103 não funciona desde a semana passada.",
        dt_envio: new Date("2026-09-20T13:10:00"),
        prazo_resposta: new Date("2026-09-25"),
        status: "ARQUIVADO",
        id_admin: admin.id_adm,
        resposta: "Chamado técnico já aberto com a manutenção predial.",
      },
    ],
  });

  const chamado = await prisma.chamadoSuporte.create({
    data: {
      id_usuario: usuarioLucas.id_usuario,
      id_admin_resp: admin.id_adm,
      assunto: "Erro ao fazer login no app",
      descricao: "Não consigo acessar o aplicativo mobile, aparece erro de autenticação.",
      status: "EM_ANDAMENTO",
      dt_abertura: new Date("2026-10-05T09:00:00"),
    },
  });

  await prisma.chamadoHistorico.create({
    data: {
      id_chamado: chamado.id_chamado,
      id_admin_status: admin.id_adm,
      observacao: "Reiniciei o cadastro de acesso do aluno; aguardando confirmação.",
      dt_registro: new Date("2026-10-05T11:00:00"),
    },
  });

  await prisma.faq.createMany({
    data: [
      {
        pergunta: "Como faço para reservar uma sala?",
        resposta: "Acesse o módulo de Reservas, escolha a sala disponível e envie a solicitação com no mínimo 48h de antecedência.",
        categoria: "Reservas",
      },
      {
        pergunta: "O que é uma reserva de emergência?",
        resposta: "É a solicitação usada quando não há sala livre e a necessidade é imediata; a administração avalia e decide em até 10 minutos.",
        categoria: "Reservas",
      },
      {
        pergunta: "Como reporto uma avaria?",
        resposta: "Escaneie o QR Code fixado na sala ou acesse o módulo de Avarias, anexando foto e uma descrição com no mínimo 30 caracteres.",
        categoria: "Manutenção",
      },
    ],
  });

  console.log("Seed concluído com sucesso.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });