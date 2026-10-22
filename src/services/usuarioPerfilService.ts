import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class UsuarioPerfilService {
  // 1. Cadastrar Aluno (situação padrão inicial: ATIVO)
  async criarAluno(dados: {
    nome: string;
    email: string;
    senha: string;
    matricula: string;
    id_turma: number;
  }) {
    if (!dados.nome || !dados.email || !dados.senha || !dados.matricula || !dados.id_turma) {
      throw new AppError('Nome, e-mail, senha, matrícula e id_turma são obrigatórios.', 400);
    }

    const turmaExiste = await prisma.turma.findUnique({
      where: { id_turma: dados.id_turma },
    });
    if (!turmaExiste) {
      throw new AppError(`A turma com ID ${dados.id_turma} não existe no banco de dados.`, 404);
    }

    const emailExiste = await prisma.usuario.findUnique({ where: { email: dados.email } });
    if (emailExiste) {
      throw new AppError('Este e-mail já está cadastrado no sistema.', 409);
    }

    const passwordHash = await bcrypt.hash(dados.senha, 8);

    try {
      return await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            nome: dados.nome,
            email: dados.email,
            senha: passwordHash,
            senha_alterada: false,
            perfil: 'ALUNO',
            status: 'ATIVO',
          },
        });

        const aluno = await tx.aluno.create({
          data: {
            id_usuario: usuario.id_usuario,
            matricula: dados.matricula,
            situacao: 'ATIVO', // Define como ATIVO no cadastro inicial
            id_turma: dados.id_turma,
          },
        });

        return {
          id_usuario: usuario.id_usuario,
          id_aluno: aluno.id_aluno,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          status: usuario.status,
          matricula: aluno.matricula,
          situacao: aluno.situacao,
          id_turma: aluno.id_turma,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Matrícula ou e-mail já cadastrado.', 409);
      }
      throw error;
    }
  }

  // 2. Atualizar situação do Aluno (ex: TRANCADO, CONCLUIDO, INATIVO)
  async atualizarSituacaoAluno(id_aluno: number, situacao: string) {
    if (!id_aluno || isNaN(id_aluno)) {
      throw new AppError('O ID do aluno é obrigatório e deve ser numérico.', 400);
    }
    if (!situacao || typeof situacao !== 'string' || situacao.trim() === '') {
      throw new AppError('A nova situação do aluno é obrigatória.', 400);
    }

    const alunoExiste = await prisma.aluno.findUnique({ where: { id_aluno } });
    if (!alunoExiste) {
      throw new AppError(`Aluno com ID ${id_aluno} não foi encontrado.`, 404);
    }

    return await prisma.aluno.update({
      where: { id_aluno },
      data: { situacao: situacao.toUpperCase().trim() },
      include: {
        usuario: { select: { id_usuario: true, nome: true, email: true } },
      },
    });
  }

  // 3. Cadastrar Docente
  async criarDocente(dados: {
    nome: string;
    email: string;
    senha: string;
    nif: string;
  }) {
    if (!dados.nome || !dados.email || !dados.senha || !dados.nif) {
      throw new AppError('Nome, e-mail, senha e NIF são obrigatórios.', 400);
    }

    const emailExiste = await prisma.usuario.findUnique({ where: { email: dados.email } });
    if (emailExiste) {
      throw new AppError('Este e-mail já está cadastrado no sistema.', 409);
    }

    const passwordHash = await bcrypt.hash(dados.senha, 8);
    
    try {
      return await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            nome: dados.nome,
            email: dados.email,
            senha: passwordHash,
            senha_alterada: false,
            perfil: 'DOCENTE',
            status: 'ATIVO',
          },
        });

        const docente = await tx.docente.create({
          data: {
            id_usuario: usuario.id_usuario,
            nif: dados.nif,
          },
        });

        return {
          id_usuario: usuario.id_usuario,
          id_docente: docente.id_docente,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          status: usuario.status,
          nif: docente.nif,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('NIF ou e-mail já cadastrado.', 409);
      }
      throw error;
    }
  }

  // 4. Cadastrar Administrador (Com NIF obrigatório)
  async criarAdministrador(dados: {
    nome: string;
    email: string;
    senha: string;
    nif: string;
  }) {
    if (!dados.nome || !dados.email || !dados.senha || !dados.nif) {
      throw new AppError('Nome, e-mail, senha e NIF são obrigatórios.', 400);
    }

    const emailExiste = await prisma.usuario.findUnique({ where: { email: dados.email } });
    if (emailExiste) {
      throw new AppError('Este e-mail já está cadastrado no sistema.', 409);
    }

    const passwordHash = await bcrypt.hash(dados.senha, 8);

    try {
      return await prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            nome: dados.nome,
            email: dados.email,
            senha: passwordHash,
            senha_alterada: false,
            perfil: 'ADMINISTRADOR',
            status: 'ATIVO',
          },
        });

        const administrador = await tx.administrador.create({
          data: {
            id_usuario: usuario.id_usuario,
            nif: dados.nif, // <-- Registra o NIF do Admin
          },
        });

        return {
          id_usuario: usuario.id_usuario,
          id_adm: administrador.id_adm,
          nome: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          status: usuario.status,
          nif: administrador.nif,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('NIF ou e-mail já cadastrado.', 409);
      }
      throw error;
    }
  }
}