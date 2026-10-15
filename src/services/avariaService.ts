import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class AvariaService {
  async listar() {
    return await prisma.avaria.findMany({
      include: {
        sala: { select: { id_sala: true, nome: true } },
        equipamento: { select: { id_equipamento: true, nome: true, nif: true } },
        docente: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
      },
      orderBy: { id_avaria: 'desc' },
    });
  }

  async buscarPorId(id_avaria: number) {
    if (isNaN(id_avaria)) throw new AppError('ID de avaria inválido.', 400);

    const avaria = await prisma.avaria.findUnique({
      where: { id_avaria },
      include: {
        sala: true,
        equipamento: true,
        docente: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
        reserva: true,
      },
    });

    if (!avaria) {
      throw new AppError('Relato de avaria não encontrado.', 404);
    }

    return avaria;
  }

  async criar(dados: {
    id_docente: number;
    id_sala?: number;
    id_equipamento?: number;
    id_reserva?: number;
    descricao: string;
    foto?: string;
    gravidade?: string;
  }) {
    if (!dados.id_sala && !dados.id_equipamento) {
      throw new AppError('Defina ao menos uma sala ou equipamento para relatar a avaria.', 400);
    }

    // 1. Validar docente
    const docente = await prisma.docente.findUnique({ where: { id_docente: dados.id_docente } });
    if (!docente) throw new AppError('Docente relator não encontrado.', 404);

    // 2. Validar sala (se informada)
    if (dados.id_sala) {
      const sala = await prisma.sala.findUnique({ where: { id_sala: dados.id_sala } });
      if (!sala) throw new AppError('Sala informada não existe.', 404);
    }

    // 3. Validar equipamento (se informado)
    if (dados.id_equipamento) {
      const equip = await prisma.equipamento.findUnique({ where: { id_equipamento: dados.id_equipamento } });
      if (!equip) throw new AppError('Equipamento informado não existe.', 404);
    }

    try {
      return await prisma.avaria.create({
        data: {
          id_docente: dados.id_docente,
          id_sala: (dados.id_sala ?? null) as any,
          id_equipamento: (dados.id_equipamento ?? null) as any,
          id_reserva: (dados.id_reserva ?? null) as any,
          descricao: dados.descricao,
          foto: dados.foto || '',
          gravidade: dados.gravidade || 'MEDIA',
          status: 'EM_ANALISE',
        },
        include: {
          sala: true,
          equipamento: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('Erro ao vincular chaves estrangeiras na avaria.', 400);
      }
      throw error;
    }
  }

  async atualizarStatus(id_avaria: number, status: string) {
    if (isNaN(id_avaria)) throw new AppError('ID de avaria inválido.', 400);

    const avaria = await prisma.avaria.findUnique({ where: { id_avaria } });
    if (!avaria) throw new AppError('Relato de avaria não encontrado.', 404);

    return await prisma.avaria.update({
      where: { id_avaria },
      data: { status },
      include: {
        sala: true,
        equipamento: true,
      },
    });
  }
}