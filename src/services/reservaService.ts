import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class ReservaService {
  async listar() {
    return await prisma.reserva.findMany({
      include: {
        sala: { select: { id_sala: true, nome: true } },
        turma: { select: { id_turma: true, nome: true, curso: true } },
      },
      orderBy: { dt_solicitacao: 'desc' },
    });
  }

  async buscarPorId(id_reserva: number) {
    if (isNaN(id_reserva)) throw new AppError('ID de reserva inválido.', 400);

    const reserva = await prisma.reserva.findUnique({
      where: { id_reserva },
      include: {
        sala: true,
        turma: true,
      },
    });

    if (!reserva) {
      throw new AppError('Reserva não encontrada', 404);
    }

    return reserva;
  }

  async criar(dados: {
    id_sala: number;
    id_turma: number;
    id_admin?: number;
    tipo?: string;
    justificativa_urgencia?: string;
    id_reserva_urgencia?: number;
  }) {
    const sala = await prisma.sala.findUnique({ where: { id_sala: dados.id_sala } });
    if (!sala || !sala.ativa) {
      throw new AppError('Sala inexistente ou inativa.', 400);
    }

    const turma = await prisma.turma.findUnique({ where: { id_turma: dados.id_turma } });
    if (!turma) {
      throw new AppError('Turma não encontrada.', 404);
    }

    try {
      return await prisma.reserva.create({
        data: {
          id_sala: dados.id_sala,
          id_turma: dados.id_turma,
          id_admin: dados.id_admin || null,
          tipo: dados.tipo || 'NORMAL',
          status: 'PENDENTE',
          dt_solicitacao: new Date(),
          justificativa_urgencia: dados.justificativa_urgencia || null,
          id_reserva_urgencia: dados.id_reserva_urgencia || null,
        },
        include: {
          sala: true,
          turma: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('Erro de chave estrangeira ao registrar a reserva.', 400);
      }
      throw error;
    }
  }

  async aprovarOuRejeitar(id_reserva: number, id_admin: number, acao: 'CONFIRMADA' | 'CANCELADA') {
    if (isNaN(id_reserva)) throw new AppError('ID de reserva inválido.', 400);

    const reserva = await prisma.reserva.findUnique({ where: { id_reserva } });
    if (!reserva) throw new AppError('Reserva não encontrada', 404);

    return await prisma.reserva.update({
      where: { id_reserva },
      data: {
        status: acao,
        id_admin,
        dt_validacao: new Date(),
      },
    });
  }
}