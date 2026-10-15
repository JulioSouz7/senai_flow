import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class ReservaDetalhesService {
  private formatarHoraParaDate(horaStr: string): Date {
    const dataHoraStr = `1970-01-01T${horaStr.length === 5 ? horaStr + ':00' : horaStr}Z`;
    const dateObj = new Date(dataHoraStr);
    if (isNaN(dateObj.getTime())) {
      throw new AppError(`Formato de hora inválido: ${horaStr}. Use HH:mm ou HH:mm:ss.`, 400);
    }
    return dateObj;
  }

  // 1. Adicionar Horário à Reserva (RESERVA_HORARIO)
  async adicionarHorario(dados: {
    id_reserva: number;
    data: Date | string;
    hora_inicio: string;
    hora_fim: string;
  }) {
    if (!dados.id_reserva || !dados.data || !dados.hora_inicio || !dados.hora_fim) {
      throw new AppError('Reserva, data, hora_inicio e hora_fim são obrigatórios.', 400);
    }

    const reserva = await prisma.reserva.findUnique({ where: { id_reserva: dados.id_reserva } });
    if (!reserva) throw new AppError('Reserva não encontrada.', 404);

    return await prisma.reservaHorario.create({
      data: {
        id_reserva: dados.id_reserva,
        data: new Date(dados.data),
        hora_inicio: this.formatarHoraParaDate(dados.hora_inicio) as any,
        hora_fim: this.formatarHoraParaDate(dados.hora_fim) as any,
      },
    });
  }

  // 2. Listar Horários de uma Reserva
  async listarHorariosPorReserva(id_reserva: number) {
    return await prisma.reservaHorario.findMany({
      where: { id_reserva },
      orderBy: { data: 'asc' },
    });
  }

  // 3. Vincular Docente à Reserva (RESERVA_DOCENTE)
  async vincularDocente(id_reserva: number, id_docente: number) {
    if (!id_reserva || !id_docente) {
      throw new AppError('Reserva e Docente são obrigatórios.', 400);
    }

    const [reserva, docente] = await Promise.all([
      prisma.reserva.findUnique({ where: { id_reserva } }),
      prisma.docente.findUnique({ where: { id_docente } }),
    ]);

    if (!reserva) throw new AppError('Reserva não encontrada.', 404);
    if (!docente) throw new AppError('Docente não encontrado.', 404);

    try {
      return await prisma.reservaDocente.create({
        data: {
          id_reserva,
          id_docente,
        },
        include: {
          docente: {
            include: {
              usuario: { select: { id_usuario: true, nome: true, email: true } },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError('Este docente já está vinculado a esta reserva.', 409);
      }
      throw error;
    }
  }

  // 4. Listar Docentes vinculados a uma Reserva
  async listarDocentesPorReserva(id_reserva: number) {
    return await prisma.reservaDocente.findMany({
      where: { id_reserva },
      include: {
        docente: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
      },
    });
  }
}