import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class EquipamentoService {
  async listar() {
    return await prisma.equipamento.findMany({
      include: {
        sala_equipamento: {
          include: {
            sala: { select: { id_sala: true, nome: true } },
          },
        },
        avarias: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id_equipamento: number) {
    const equipamento = await prisma.equipamento.findUnique({
      where: { id_equipamento },
      include: {
        sala_equipamento: {
          include: {
            sala: true,
          },
        },
        avarias: true,
      },
    });

    if (!equipamento) {
      throw new AppError('Equipamento não encontrado', 404);
    }

    return equipamento;
  }

  async criar(dados: { nome: string; descricao?: string; nif: string; status?: string }) {
    try {
      return await prisma.equipamento.create({
        data: {
          nome: dados.nome,
          descricao: dados.descricao,
          nif: dados.nif,
          status: dados.status || 'DISPONIVEL',
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Já existe um equipamento cadastrado com este NIF/Código de barras.', 400);
      }
      throw error;
    }
  }

  async vincularASala(id_sala: number, id_equipamento: number, quantidade: number) {
    const sala = await prisma.sala.findUnique({ where: { id_sala } });
    if (!sala) throw new AppError('Sala não encontrada', 404);

    const equipamento = await prisma.equipamento.findUnique({ where: { id_equipamento } });
    if (!equipamento) throw new AppError('Equipamento não encontrado', 404);

    return await prisma.salaEquipamento.upsert({
      where: {
        id_sala_id_equipamento: { id_sala, id_equipamento },
      },
      update: { quantidade },
      create: { id_sala, id_equipamento, quantidade },
    });
  }
  async atualizar(id_equipamento: number, dados: { nome?: string; descricao?: string; nif?: string; status?: string }) {
  const equipamento = await prisma.equipamento.findUnique({ where: { id_equipamento } });

  if (!equipamento) {
    throw new AppError('Equipamento não encontrado', 404);
  }

  try {
    return await prisma.equipamento.update({
      where: { id_equipamento },
      data: dados,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('O NIF/Código informado já pertence a outro equipamento.', 400);
    }
    throw error;
  }
}
}