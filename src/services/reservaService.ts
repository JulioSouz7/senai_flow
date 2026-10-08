import prisma from '../config/prisma';

export class ReservaService {
  async listar() {
    return await prisma.reserva.findMany({
      include: {
        sala: {
          include: {
            predio: true,
          },
        },
        turma: true,
        reserva_horario: true,
        reserva_docente: {
          include: {
            docente: {
              include: {
                usuario: {
                  select: { nome: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        dt_solicitacao: 'desc',
      },
    });
  }

  async buscarPorId(id_reserva: number) {
    const reserva = await prisma.reserva.findUnique({
      where: { id_reserva },
      include: {
        sala: {
          include: {
            predio: true,
          },
        },
        turma: true,
        reserva_horario: true,
        reserva_docente: {
          include: {
            docente: {
              include: {
                usuario: {
                  select: { nome: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!reserva) {
      throw new Error('Reserva não encontrada');
    }

    return reserva;
  }

  async criar(dados: {
    id_sala: number;
    id_turma: number;
    id_docente: number;
    data: string; // formato YYYY-MM-DD
    hora_inicio: string; // formato HH:mm:ss ou ISO
    hora_fim: string; // formato HH:mm:ss ou ISO
    tipo?: string;
  }) {
    const { id_sala, id_turma, id_docente, data, hora_inicio, hora_fim, tipo } = dados;

    // Converte datas e horários para o formato do Postgres/Prisma
    const dtData = new Date(data);
    const dtInicio = new Date(`${data}T${hora_inicio}`);
    const dtFim = new Date(`${data}T${hora_fim}`);

    return await prisma.reserva.create({
      data: {
        id_sala,
        id_turma,
        tipo: tipo || 'NORMAL',
        status: 'PENDENTE',
        reserva_horario: {
          create: {
            data: dtData,
            hora_inicio: dtInicio,
            hora_fim: dtFim,
          },
        },
        reserva_docente: {
          create: {
            id_docente,
          },
        },
      },
      include: {
        sala: true,
        turma: true,
        reserva_horario: true,
      },
    });
  }
}