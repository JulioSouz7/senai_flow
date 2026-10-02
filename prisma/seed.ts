import { PrismaClient, PerfilUsuario, StatusManutencao, SeveridadeRisco } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpando tabelas...');
  await prisma.historicoSenha.deleteMany();
  await prisma.pontuacaoTurma.deleteMany();
  await prisma.relatosSugestoes.deleteMany();
  await prisma.areaRisco.deleteMany();
  await prisma.trocaSala.deleteMany();
  await prisma.manutencao.deleteMany();
  await prisma.equipamento.deleteMany();
  await prisma.reserva.deleteMany();
  await prisma.turmaUsuario.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.sala.deleteMany();
  await prisma.usuario.deleteMany();

  console.log('🌱 Criando dados de teste do SENAI Flow...');

  const senhaComum = await bcrypt.hash('1234', 10);

  const admin = await prisma.usuario.create({
    data: {
      nome: 'Coordenação Pedagógica',
      email: 'gestao@sp.senai.br',
      senha: senhaComum,
      nifCpf: 'NIF-0001',
      perfil: PerfilUsuario.ADMINISTRADOR,
    },
  });

  const professor1 = await prisma.usuario.create({
    data: {
      nome: 'Edgard Coutinho',
      email: 'edgard.coutinho@sp.senai.br',
      senha: senhaComum,
      nifCpf: 'NIF-1002',
      perfil: PerfilUsuario.DOCENTE,
    },
  });

  const aluno = await prisma.usuario.create({
    data: {
      nome: 'Arthur Henrique Vieira',
      email: 'arthur.aluno@sp.senai.br',
      senha: senhaComum,
      nifCpf: 'CPF-44455566677',
      perfil: PerfilUsuario.ALUNO,
    },
  });

  const salaD01 = await prisma.sala.create({
    data: {
      nome: 'Laboratório de Software D01',
      bloco: 'Bloco D',
      capacidade: 35,
      tipo: 'Laboratório Informática',
      ativa: true,
      qrCode: 'TOKEN_QR_SALAD01_SENAI',
    },
  });

  const turmaTDS = await prisma.turma.create({
    data: {
      nome: 'Técnico em Desenvolvimento de Sistemas - 2B',
      periodo: 'Vespertino',
      cargaHorariaSemanal: 20,
    },
  });

  await prisma.turmaUsuario.create({
    data: {
      idTurma: turmaTDS.idTurma,
      idUsuario: aluno.idUsuario,
    },
  });

  const projetor = await prisma.equipamento.create({
    data: {
      nome: 'Projetor Epson PowerLite',
      nif: 'NIF-SENAI-88392',
      status: 'DISPONIVEL',
      idSala: salaD01.idSala,
    },
  });

  await prisma.manutencao.create({
    data: {
      descricao: 'Cabo HDMI do projetor apresentando mau contato.',
      status: StatusManutencao.ABERTA,
      idEquipamento: projetor.idEquipamento,
      idUsuario: professor1.idUsuario,
    },
  });

  await prisma.areaRisco.create({
    data: {
      descricao: 'Piso escorregadio próximo ao laboratório em dias de chuva.',
      severidade: SeveridadeRisco.MEDIA,
      bloco: 'Bloco D',
      andar: 1,
      idSala: salaD01.idSala,
    },
  });

  await prisma.pontuacaoTurma.create({
    data: {
      pontos: 150,
      idTurma: turmaTDS.idTurma,
    },
  });

  console.log('✅ Seed executado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });