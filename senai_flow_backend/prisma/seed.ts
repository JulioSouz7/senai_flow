import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o novo seed no banco de dados...');

  // ==========================================
  // 0. HORÁRIOS (10 registros)
  // ==========================================
  console.log('Criando 10 horários...');
  const horarios = await Promise.all([
    prisma.horario.create({ data: { hora_inicio: '08:00', hora_fim: '08:50' } }),
    prisma.horario.create({ data: { hora_inicio: '08:50', hora_fim: '09:40' } }),
    prisma.horario.create({ data: { hora_inicio: '10:00', hora_fim: '10:50' } }),
    prisma.horario.create({ data: { hora_inicio: '10:50', hora_fim: '11:40' } }),
    prisma.horario.create({ data: { hora_inicio: '13:00', hora_fim: '13:50' } }),
    prisma.horario.create({ data: { hora_inicio: '13:50', hora_fim: '14:40' } }),
    prisma.horario.create({ data: { hora_inicio: '15:00', hora_fim: '15:50' } }),
    prisma.horario.create({ data: { hora_inicio: '15:50', hora_fim: '16:40' } }),
    prisma.horario.create({ data: { hora_inicio: '19:00', hora_fim: '19:50' } }),
    prisma.horario.create({ data: { hora_inicio: '19:50', hora_fim: '20:40' } }),
  ]);

  // ==========================================
  // 1. USUÁRIOS & PERFIS (3 por entidade)
  // ==========================================
  console.log('Criando novos usuários e perfis...');

  // -- Administradores --
  const userAdmin1 = await prisma.usuario.create({
    data: { nome: 'Fernanda Lima', email: 'fernanda.admin@senai.br', senha: 'hash_senha_456', perfil: 'ADMINISTRADOR' },
  });
  const admin1 = await prisma.administrador.create({
    data: { id_usuario: userAdmin1.id_usuario, nif: 'NIF-ADM-101' },
  });

  const userAdmin2 = await prisma.usuario.create({
    data: { nome: 'Ricardo Alves', email: 'ricardo.admin@senai.br', senha: 'hash_senha_456', perfil: 'ADMINISTRADOR' },
  });
  const admin2 = await prisma.administrador.create({
    data: { id_usuario: userAdmin2.id_usuario, nif: 'NIF-ADM-102' },
  });

  const userAdmin3 = await prisma.usuario.create({
    data: { nome: 'Patricia Souza', email: 'patricia.admin@senai.br', senha: 'hash_senha_456', perfil: 'ADMINISTRADOR' },
  });
  const admin3 = await prisma.administrador.create({
    data: { id_usuario: userAdmin3.id_usuario, nif: 'NIF-ADM-103' },
  });

  // -- Docentes --
  const userDoc1 = await prisma.usuario.create({
    data: { nome: 'Prof. Marcos Vinicius', email: 'marcos.docente@senai.br', senha: 'hash_senha_456', perfil: 'DOCENTE' },
  });
  const docente1 = await prisma.docente.create({
    data: { id_usuario: userDoc1.id_usuario, nif: 'NIF-DOC-101' },
  });

  const userDoc2 = await prisma.usuario.create({
    data: { nome: 'Profa. Juliana Ribeiro', email: 'juliana.docente@senai.br', senha: 'hash_senha_456', perfil: 'DOCENTE' },
  });
  const docente2 = await prisma.docente.create({
    data: { id_usuario: userDoc2.id_usuario, nif: 'NIF-DOC-102' },
  });

  const userDoc3 = await prisma.usuario.create({
    data: { nome: 'Prof. Eduardo Ramos', email: 'eduardo.docente@senai.br', senha: 'hash_senha_456', perfil: 'DOCENTE' },
  });
  const docente3 = await prisma.docente.create({
    data: { id_usuario: userDoc3.id_usuario, nif: 'NIF-DOC-103' },
  });

  // ==========================================
  // 2. GESTÃO ACADÊMICA (3 Turmas & Alunos)
  // ==========================================
  console.log('Criando turmas e alunos...');
  const turma1 = await prisma.turma.create({
    data: { nome: 'AUT-2026-1M', curso: 'Automação Industrial', qtd_alunos: 28, carga_horaria_semanal: 20 },
  });
  const turma2 = await prisma.turma.create({
    data: { nome: 'RED-2026-1T', curso: 'Redes de Computadores', qtd_alunos: 22, carga_horaria_semanal: 16 },
  });
  const turma3 = await prisma.turma.create({
    data: { nome: 'LOG-2026-1N', curso: 'Logística', qtd_alunos: 35, carga_horaria_semanal: 14 },
  });

  // -- Alunos --
  const userAluno1 = await prisma.usuario.create({
    data: { nome: 'Camila Rocha', email: 'camila.aluno@aluno.senai.br', senha: 'hash_senha_456', perfil: 'ALUNO' },
  });
  await prisma.aluno.create({
    data: { id_usuario: userAluno1.id_usuario, matricula: 'MAT-101', id_turma: turma1.id_turma },
  });

  const userAluno2 = await prisma.usuario.create({
    data: { nome: 'Bruno Martins', email: 'bruno.aluno@aluno.senai.br', senha: 'hash_senha_456', perfil: 'ALUNO' },
  });
  await prisma.aluno.create({
    data: { id_usuario: userAluno2.id_usuario, matricula: 'MAT-102', id_turma: turma2.id_turma },
  });

  const userAluno3 = await prisma.usuario.create({
    data: { nome: 'Isabela Faria', email: 'isabela.aluno@aluno.senai.br', senha: 'hash_senha_456', perfil: 'ALUNO' },
  });
  await prisma.aluno.create({
    data: { id_usuario: userAluno3.id_usuario, matricula: 'MAT-103', id_turma: turma3.id_turma },
  });

  // -- DocenteTurma --
  await prisma.docenteTurma.createMany({
    data: [
      { id_docente: docente1.id_docente, id_turma: turma1.id_turma },
      { id_docente: docente2.id_docente, id_turma: turma2.id_turma },
      { id_docente: docente3.id_docente, id_turma: turma3.id_turma },
    ],
  });

  // ==========================================
  // 3. INFRAESTRUTURA & ESPAÇOS
  // ==========================================
  console.log('Criando prédios, salas e equipamentos...');
  const predio1 = await prisma.predio.create({ data: { nome: 'Pavilhão Principal' } });
  const predio2 = await prisma.predio.create({ data: { nome: 'Anexo de Automação' } });
  const predio3 = await prisma.predio.create({ data: { nome: 'Centro de Robótica' } });

  const sala1 = await prisma.sala.create({
    data: { id_predio: predio1.id_predio, nome: 'Lab Redes & Cisco', capacidade: 30, qr_code: 'QR-REDES-101', foto: 'lab_redes.png' },
  });
  const sala2 = await prisma.sala.create({
    data: { id_predio: predio2.id_predio, nome: 'Oficina PLC & Robótica', capacidade: 20, qr_code: 'QR-PLC-102', foto: 'oficina_plc.png' },
  });
  const sala3 = await prisma.sala.create({
    data: { id_predio: predio3.id_predio, nome: 'Auditório Tecnológico', capacidade: 80, qr_code: 'QR-AUD-103', foto: 'auditorio.png' },
  });

  // -- Equipamentos --
  const eq1 = await prisma.equipamento.create({
    data: { nome: 'Rack de Servidores Dell', descricao: 'Rack completo com Switch L3 e Patch Panel', nif: 'EQ-SER-101' },
  });
  const eq2 = await prisma.equipamento.create({
    data: { nome: 'Bancada Didática PLC Siemens', descricao: 'Bancada com CLP S7-1200 e IHM', nif: 'EQ-PLC-102' },
  });
  const eq3 = await prisma.equipamento.create({
    data: { nome: 'Braço Robótico KUKA', descricao: 'Robô articulado didático de 6 eixos', nif: 'EQ-ROB-103' },
  });

  await prisma.salaEquipamento.createMany({
    data: [
      { id_sala: sala1.id_sala, id_equipamento: eq1.id_equipamento, quantidade: 2 },
      { id_sala: sala2.id_sala, id_equipamento: eq2.id_equipamento, quantidade: 4 },
      { id_sala: sala3.id_sala, id_equipamento: eq3.id_equipamento, quantidade: 1 },
    ],
  });

  // -- Áreas de Risco --
  await prisma.areaRisco.createMany({
    data: [
      { id_predio: predio2.id_predio, id_adm: admin1.id_adm, nome: 'Célula Robotizada', tipo: 'Mecânico/Móvel', orientacao_seguranca: 'Manter distância da linha amarela e acionar parada de emergência se necessário.', andar: 1, status: 'ATIVO' },
      { id_predio: predio1.id_predio, id_adm: admin2.id_adm, nome: 'Sala de NoBreaks & Baterias', tipo: 'Elétrico/Químico', orientacao_seguranca: 'Proibido fumar ou gerar faíscas. Acesso restrito.', andar: 2, status: 'ATIVO' },
      { id_predio: predio3.id_predio, id_adm: admin3.id_adm, nome: 'Prensa Hidráulica', tipo: 'Alta Pressão', orientacao_seguranca: 'Utilizar protetor auricular e óculos de proteção.', andar: 1, status: 'ATIVO' },
    ],
  });

  // -- SalaHorario --
  const sh1 = await prisma.salaHorario.create({
    data: { id_sala: sala1.id_sala, id_horario: horarios[0].id_horario, dia_semana: 1, ativo: true },
  });
  const sh2 = await prisma.salaHorario.create({
    data: { id_sala: sala2.id_sala, id_horario: horarios[4].id_horario, dia_semana: 3, ativo: true },
  });
  const sh3 = await prisma.salaHorario.create({
    data: { id_sala: sala3.id_sala, id_horario: horarios[8].id_horario, dia_semana: 5, ativo: true },
  });

  // ==========================================
  // 4. RESERVAS & AGENDAMENTOS
  // ==========================================
  console.log('Criando reservas e trocas...');
  const res1 = await prisma.reserva.create({
    data: { id_sala: sala1.id_sala, id_turma: turma2.id_turma, id_admin: admin1.id_adm, tipo: 'NORMAL', status: 'CONFIRMADA' },
  });
  const res2 = await prisma.reserva.create({
    data: { id_sala: sala2.id_sala, id_turma: turma1.id_turma, id_admin: admin2.id_adm, tipo: 'NORMAL', status: 'PENDENTE' },
  });
  const res3 = await prisma.reserva.create({
    data: { id_sala: sala3.id_sala, id_turma: turma3.id_turma, id_admin: admin3.id_adm, tipo: 'URGENCIA', status: 'CONFIRMADA', justificativa_urgencia: 'Apresentação de TCC para banca externa.' },
  });

  await prisma.reservaDocente.createMany({
    data: [
      { id_reserva: res1.id_reserva, id_docente: docente2.id_docente },
      { id_reserva: res2.id_reserva, id_docente: docente1.id_docente },
      { id_reserva: res3.id_reserva, id_docente: docente3.id_docente },
    ],
  });

  await prisma.reservaHorario.createMany({
    data: [
      { id_reserva: res1.id_reserva, id_sala_horario: sh1.id_sala_horario, dt_reserva: new Date('2026-11-10') },
      { id_reserva: res2.id_reserva, id_sala_horario: sh2.id_sala_horario, dt_reserva: new Date('2026-11-11') },
      { id_reserva: res3.id_reserva, id_sala_horario: sh3.id_sala_horario, dt_reserva: new Date('2026-11-12') },
    ],
  });

  // -- TrocaSala & Pontuacao --
  await prisma.trocaSala.createMany({
    data: [
      { id_reserva: res1.id_reserva, id_sala_origem: sala1.id_sala, id_sala_destino: sala3.id_sala, id_docente_solicitante: docente2.id_docente, id_coordenador: admin1.id_adm, status: 'ACEITA', motivo: 'Maior capacidade de público' },
      { id_reserva: res2.id_reserva, id_sala_origem: sala2.id_sala, id_sala_destino: sala1.id_sala, id_docente_solicitante: docente1.id_docente, status: 'PENDENTE', motivo: 'Problema no software de simulação da sala 2' },
      { id_reserva: res3.id_reserva, id_sala_origem: sala3.id_sala, id_sala_destino: sala2.id_sala, id_docente_solicitante: docente3.id_docente, id_coordenador: admin2.id_adm, status: 'RECUSADA', motivo: 'Sala reservada no mesmo horário' },
    ],
  });

  await prisma.pontuacao.createMany({
    data: [
      { id_reserva: res1.id_reserva, id_sala: sala1.id_sala, pontos: 20, semestre_letivo: '2026.2' },
      { id_reserva: res3.id_reserva, id_sala: sala3.id_sala, pontos: 25, semestre_letivo: '2026.2' },
    ],
  });

  // ==========================================
  // 5. SOLICITAÇÕES DE EQUIPAMENTOS
  // ==========================================
  console.log('Criando solicitações de equipamentos...');
  const sol1 = await prisma.solicitacaoEquipamento.create({
    data: { id_docente: docente2.id_docente, id_admin_analise: admin1.id_adm, id_reserva: res1.id_reserva, status: 'APROVADO' },
  });
  const sol2 = await prisma.solicitacaoEquipamento.create({
    data: { id_docente: docente1.id_docente, id_reserva: res2.id_reserva, status: 'EM ANÁLISE' },
  });
  const sol3 = await prisma.solicitacaoEquipamento.create({
    data: { id_docente: docente3.id_docente, id_admin_analise: admin2.id_adm, id_reserva: res3.id_reserva, status: 'RECUSADO' },
  });

  await prisma.itemSolicitacao.createMany({
    data: [
      { id_solicitacao: sol1.id_solicitacao, id_equipamento: eq1.id_equipamento, quantidade: 1 },
      { id_solicitacao: sol2.id_solicitacao, id_equipamento: eq2.id_equipamento, quantidade: 2 },
      { id_solicitacao: sol3.id_solicitacao, id_equipamento: eq3.id_equipamento, quantidade: 1 },
    ],
  });

  // ==========================================
  // 6. OCORRÊNCIAS & MANUTENÇÃO (Avarias)
  // ==========================================
  console.log('Criando avarias...');
  await prisma.avaria.createMany({
    data: [
      { id_docente: docente1.id_docente, id_sala: sala2.id_sala, id_equipamento: eq2.id_equipamento, descricao: 'O módulo da IHM da bancada Siemens está congelando a tela inicial ao ligar.', foto: 'avaria_ihm.jpg', gravidade: 'MEDIA', status: 'ENCAMINHADO' },
      { id_docente: docente2.id_docente, id_sala: sala1.id_sala, id_equipamento: eq1.id_equipamento, descricao: 'Porta de rede número 12 do switch principal está com conector danificado.', foto: 'avaria_switch.jpg', gravidade: 'BAIXA', status: 'EM_ANALISE' },
      { id_docente: docente3.id_docente, id_sala: sala3.id_sala, descricao: 'Caixa de som direita do auditório apresentando chiado forte durante microfonia.', foto: 'avaria_som.jpg', gravidade: 'BAIXA', status: 'FINALIZADO' },
    ],
  });

  // ==========================================
  // 7. COMUNICAÇÃO & SUPORTE
  // ==========================================
  console.log('Criando comunicados, relatos, suporte e FAQ...');

  await prisma.comunicado.createMany({
    data: [
      { id_adm: admin1.id_adm, id_turma: null, id_reserva: null, titulo: 'Feira de Tecnologia SENAI 2026', conteudo: 'As inscrições para apresentação de projetos da Feira de Tecnologia estão abertas.', abrangencia: 'GERAL', publico_alvo: 'Toda a comunidade acadêmica' },
      { id_adm: admin1.id_adm, id_turma: turma2.id_turma, id_reserva: res1.id_reserva, titulo: 'Aulão de Redes de Computadores', conteudo: 'Sessão prática confirmada no Lab Redes & Cisco.', abrangencia: 'TURMA', publico_alvo: 'Alunos RED-2026-1T' },
      { id_adm: admin2.id_adm, id_turma: turma1.id_turma, id_reserva: null, titulo: 'Treinamento de Segurança', conteudo: 'Treinamento obrigatório para acesso ao Centro de Robótica.', abrangencia: 'TURMA', publico_alvo: 'Alunos AUT-2026-1M' },
    ],
  });

  const rel1 = await prisma.relatoSugestao.create({
    data: { id_usuario: userAluno1.id_usuario, tipo: 'SUGESTAO', descricao: 'Disponibilizar mais computadores com Linux no laboratório.', status: 'LIDO', id_admin: admin1.id_adm, resposta: 'Analisando viabilidade técnica com TI.' },
  });
  const rel2 = await prisma.relatoSugestao.create({
    data: { id_usuario: userDoc1.id_usuario, tipo: 'RECLAMACAO', descricao: 'Temperatura do ar condicionado do laboratório de PLC está muito baixa.', status: 'PENDENTE' },
  });
  const rel3 = await prisma.relatoSugestao.create({
    data: { id_usuario: userAluno3.id_usuario, tipo: 'SUGESTAO', descricao: 'Aumento da velocidade da rede Wi-Fi para alunos.', status: 'ENVIADO' },
  });

  await prisma.relatoHistorico.createMany({
    data: [
      { id_relato: rel1.id_relato, id_admin_status: admin1.id_adm, status: 'LIDO' },
      { id_relato: rel2.id_relato, id_admin_status: admin2.id_adm, status: 'ABERTO' },
      { id_relato: rel3.id_relato, id_admin_status: admin3.id_adm, status: 'ABERTO' },
    ],
  });

  await prisma.chamadoSuporte.createMany({
    data: [
      { id_usuario: userDoc2.id_usuario, id_admin_resp: admin1.id_adm, assunto: 'Instalação de Software', descricao: 'Necessito do software Wireshark instalado nos PCs do Lab 1.', status: 'EM_ANDAMENTO' },
      { id_usuario: userAluno2.id_usuario, id_admin_resp: admin2.id_adm, assunto: 'Carteirinha Estudantil', descricao: 'Solicitação de 2ª via da carteirinha virtual.', status: 'RESOLVIDO' },
      { id_usuario: userDoc3.id_usuario, assunto: 'Projetor com cabo Danificado', descricao: 'Substituição do cabo HDMI do auditório.', status: 'ABERTO' },
    ],
  });

  await prisma.faq.createMany({
    data: [
      { pergunta: 'Como solicitar troca de sala?', resposta: 'O docente deve ir ao menu de Reservas Ativas, selecionar a opção Troca e indicar a nova sala e motivo.', categoria: 'Salas' },
      { pergunta: 'Qual o prazo de análise para solicitação de equipamentos?', resposta: 'As solicitações são analisadas pela coordenação em até 24 horas úteis.', categoria: 'Equipamentos' },
      { pergunta: 'Como relatar uma avaria em um equipamento?', resposta: 'Acesse Ocorrências > Registrar Avaria, selecione a sala/equipamento, inclua uma descrição detalhada e anexe uma foto.', categoria: 'Manutenção' },
    ],
  });

  console.log('✨ Seed renovado executado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });