import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class SalaService {
  async listar() {
    return await prisma.sala.findMany({
      include: {
        predio: true,
      },
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id_sala: number) {
    const sala = await prisma.sala.findUnique({
      where: { id_sala },
      include: {
        predio: true,
        sala_equipamento: {
          include: {
            equipamento: true,
          },
        },
        avarias: true,
      },
    });

    if (!sala) {
      throw new AppError('Sala não encontrada', 404);
    }

    return sala;
  }

  async criar(dados: { nome: string; id_predio: number; capacidade: number; qr_code: string }) {
    try {
      return await prisma.sala.create({
        data: {
          nome: dados.nome,
          id_predio: dados.id_predio,
          capacidade: dados.capacidade,
          qr_code: dados.qr_code,
          ativa: true,
        },
        include: {
          predio: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new AppError(`O prédio com id_predio ${dados.id_predio} não existe no banco de dados.`, 400);
        }
        if (error.code === 'P2002') {
          throw new AppError('O qr_code informado já está cadastrado em outra sala.', 400);
        }
      }
      throw error;
    }
  }

  async atualizar(id_sala: number, dados: { nome?: string; id_predio?: number; capacidade?: number; qr_code?: string }) {
    const sala = await prisma.sala.findUnique({ where: { id_sala } });

    if (!sala) {
      throw new AppError('Sala não encontrada', 404);
    }

    try {
      return await prisma.sala.update({
        where: { id_sala },
        data: dados,
        include: { predio: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new AppError('O id_predio informado não existe no banco de dados.', 400);
        }
        if (error.code === 'P2002') {
          throw new AppError('O qr_code informado já pertence a outra sala.', 400);
        }
      }
      throw error;
    }
  }

  async desativar(id_sala: number) {
    const sala = await prisma.sala.findUnique({ where: { id_sala } });

    if (!sala) {
      throw new AppError('Sala não encontrada', 404);
    }

    return await prisma.sala.update({
      where: { id_sala },
      data: { ativa: false },
      select: { id_sala: true, nome: true, ativa: true },
    });
  }

  async reativar(id_sala: number) {
    const sala = await prisma.sala.findUnique({ where: { id_sala } });

    if (!sala) {
      throw new AppError('Sala não encontrada', 404);
    }

    return await prisma.sala.update({
      where: { id_sala },
      data: { ativa: true },
      select: { id_sala: true, nome: true, ativa: true },
    });
  }
}