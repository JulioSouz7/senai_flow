import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class TrocaSalaService {
  async listar() {
    return await prisma.trocaSala.findMany({
      include: {
        reserva: true,
        sala_origem: { select: { id_sala: true, nome: true } },
        sala_destino: { select: { id_sala: true, nome: true } },
        docente_solicitante: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
      },
      orderBy: { id_troca: 'desc' },
    });
  }

  async buscarPorId(id_troca: number) {
    if (isNaN(id_troca)) throw new AppError('ID de troca de sala inválido.', 400);

    const troca = await prisma.trocaSala.findUnique({
      where: { id_troca },
      include: {
        reserva: true,
        sala_origem: true,
        sala_destino: true,
        docente_solicitante: true,
      },
    });

    if (!troca) {
      throw new AppError('Solicitação de troca de sala não encontrada.', 404);
    }

    return troca;
  }

  async solicitar(dados: {
    id_reserva: number;
    id_sala_origem: number;
    id_sala_destino: number;
    id_docente_solicitante: number;
    motivo: string;
  }) {
    if (!dados.id_reserva || !dados.id_sala_origem || !dados.id_sala_destino || !dados.id_docente_solicitante || !dados.motivo) {
      throw new AppError('Reserva, sala de origem, sala de destino, docente solicitante e motivo são obrigatórios.', 400);
    }

    // 1. Validar existência da reserva de origem
    const reserva = await prisma.reserva.findUnique({ where: { id_reserva: dados.id_reserva } });
    if (!reserva) throw new AppError('Reserva de origem não encontrada.', 404);

    // 2. Validar existência do docente solicitante
    const docente = await prisma.docente.findUnique({ where: { id_docente: dados.id_docente_solicitante } });
    if (!docente) throw new AppError('Docente solicitante não encontrado.', 404);

    try {
      return await prisma.trocaSala.create({
        data: {
          id_reserva: dados.id_reserva,
          id_sala_origem: dados.id_sala_origem,
          id_sala_destino: dados.id_sala_destino,
          id_docente_solicitante: dados.id_docente_solicitante,
          id_coordenador: null as any,
          status: 'PENDENTE',
          motivo: dados.motivo,
          dt_troca: new Date(),
        },
        include: {
          reserva: true,
          sala_origem: true,
          sala_destino: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('Erro ao associar chaves estrangeiras na solicitação de troca.', 400);
      }
      throw error;
    }
  }

  async responderEntreDocentes(id_troca: number, status: 'ACEITA' | 'RECUSADA' | 'APROVADA' | 'REJEITADA') {
    if (isNaN(id_troca)) throw new AppError('ID de troca inválido.', 400);

    const troca = await prisma.trocaSala.findUnique({ where: { id_troca } });
    if (!troca) throw new AppError('Solicitação de troca de sala não encontrada.', 404);

    if (troca.status !== 'PENDENTE') {
      throw new AppError(`Esta solicitação de troca já foi respondida com o status: ${troca.status}.`, 400);
    }

    // Se o outro docente aceitou, invertemos/atualizamos a sala da reserva
    if (status === 'ACEITA' || status === 'APROVADA') {
      await prisma.reserva.update({
        where: { id_reserva: troca.id_reserva },
        data: { id_sala: troca.id_sala_destino },
      });
    }

    return await prisma.trocaSala.update({
      where: { id_troca },
      data: {
        status,
      },
      include: {
        reserva: true,
        sala_origem: true,
        sala_destino: true,
      },
    });
  }
}