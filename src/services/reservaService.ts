import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

interface IHorarioReservaInput {
  id_sala_horario: number;
  dt_reserva: string; // Ex: "2026-03-30"
}

interface ICriarReservaInput {
  id_sala: number;
  id_turma: number;
  id_docente: number;
  nome_solicitante: string;
  horarios: IHorarioReservaInput[];
}

interface IReservaUrgenciaInput extends ICriarReservaInput {
  justificativa_urgencia: string;
}

interface IEncerrarReservaInput {
  sala_em_ordem: boolean;
  houve_avaria: boolean;
  obs_encerramento?: string;
}

interface IListarReservasFiltros {
  id_sala?: number;
  id_turma?: number;
  id_docente?: number;
  status?: string; // PENDENTE | CONFIRMADA | RECUSADA | CANCELADA | ENCERRADA
}

export class ReservaService {
  async listarReservas(filtros: IListarReservasFiltros) {
    const { id_sala, id_turma, id_docente, status } = filtros;

    return await prisma.reserva.findMany({
      where: {
        ...(id_sala ? { id_sala } : {}),
        ...(id_turma ? { id_turma } : {}),
        ...(status ? { status } : {}),
        ...(id_docente
          ? {
              reserva_docente: {
                some: { id_docente },
              },
            }
          : {}),
      },
      include: {
        sala: true,
        turma: true,
        administrador: {
          select: {
            id_adm: true,
            usuario: {
              select: { nome: true, email: true },
            },
          },
        },
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
        reserva_horario: {
          include: {
            sala_horario: {
              include: {
                horario: true,
              },
            },
          },
          orderBy: { dt_reserva: 'asc' },
        },
      },
      orderBy: { dt_solicitacao: 'desc' },
    });
  }

  async listarPendentes() {
    return await prisma.reserva.findMany({
      where: { status: 'PENDENTE' },
      include: {
        sala: true,
        turma: true,
        reserva_docente: {
          include: {
            docente: {
              include: {
                usuario: { select: { nome: true, email: true } },
              },
            },
          },
        },
        reserva_horario: {
          include: {
            sala_horario: { include: { horario: true } },
          },
          orderBy: { dt_reserva: 'asc' },
        },
      },
      orderBy: { dt_solicitacao: 'asc' }, // As solicitações mais antigas aparecem primeiro
    });
  }

  // 1. Criar Reserva Normal (Docente ou Admin)
  async criarReserva(dados: ICriarReservaInput) {
    if (!dados.horarios || dados.horarios.length === 0) {
      throw new AppError('É necessário informar ao menos um horário para efetuar a reserva.', 400);
    }

    // RN06: Toda reserva deve ser solicitada com no mínimo 48 horas de antecedência
    const agora = new Date();
    for (const h of dados.horarios) {
      const dataHoraReserva = new Date(h.dt_reserva);
      const diferencaHoras = (dataHoraReserva.getTime() - agora.getTime()) / (1000 * 60 * 60);
      if (diferencaHoras < 48) {
        throw new AppError('Toda reserva deve ser solicitada com no mínimo 48 horas de antecedência.', 400);
      }
    }

    // RN19: Cada reserva deve ser associada a uma única turma e no mínimo a 1 professor
    const turmaExiste = await prisma.turma.findUnique({ where: { id_turma: dados.id_turma } });
    if (!turmaExiste) {
      throw new AppError('A turma informada não existe.', 404);
    }

    const salaExistente = await prisma.sala.findUnique({ where: { id_sala: dados.id_sala } });
    if (!salaExistente) {
      throw new AppError('A Sala informada não existe.', 404);
    }

    const docenteExiste = await prisma.docente.findUnique({ where: { id_docente: dados.id_docente } });
    if (!docenteExiste) {
      throw new AppError('O docente informado não foi encontrado.', 404);
    }

    // RN26: Limite de 10 horas de reserva por semana por docente
    const totalReservasSemana = await prisma.reservaHorario.count({
      where: {
        reserva: {
          reserva_docente: { some: { id_docente: dados.id_docente } },
          status: { in: ['PENDENTE', 'CONFIRMADA'] },
        },
      },
    });

    if (totalReservasSemana + dados.horarios.length > 10) {
      throw new AppError('O docente não pode exceder o limite de 10 horas de sala por semana (RN26).', 400);
    }

    // Validação de Conflito de Horário e Horário Fixo (RN28 e RN31)
    for (const h of dados.horarios) {
      const conflito = await prisma.reservaHorario.findFirst({
        where: {
          id_sala_horario: h.id_sala_horario,
          dt_reserva: new Date(h.dt_reserva),
          reserva: { status: { in: ['PENDENTE', 'CONFIRMADA'] } },
        },
      });

      if (conflito) {
        // RN33: Sugerir automaticamente salas alternativas livres
        const salaHorarioAtual = await prisma.salaHorario.findUnique({ where: { id_sala_horario: h.id_sala_horario } });

        const salasAlternativas = await prisma.sala.findMany({
          where: {
            id_sala: { not: dados.id_sala },
            ativa: true,
            horarios_disponiveis: {
              some: { id_horario: salaHorarioAtual?.id_horario },
            },
          },
          take: 3,
        });

        throw new AppError(
          `Horário indisponível para esta sala. Sugestão de salas alternativas com este horário vago: ${salasAlternativas.map((s) => s.nome).join(', ') || 'Nenhuma no momento'
          } .`,
          409
        );
      }
    }

    // RN05: Cria a reserva com status PENDENTE para validação da Administração
    return await prisma.$transaction(async (tx) => {
      const reserva = await tx.reserva.create({
        data: {
          id_sala: dados.id_sala,
          id_turma: dados.id_turma,
          tipo: 'NORMAL',
          status: 'PENDENTE',
          dt_solicitacao: new Date(),
          reserva_docente: {
            create: { id_docente: dados.id_docente },
          },
          reserva_horario: {
            create: dados.horarios.map((h) => ({
              id_sala_horario: h.id_sala_horario,
              dt_reserva: new Date(h.dt_reserva),
            })),
          },
        },
        include: { sala: true, turma: true, reserva_horario: true },
      });

      return {
        reserva,
        mensagem: 'Solicitação de reserva enviada com sucesso! Aguardando aprovação da administração.',
      };
    });
  }

  // 2. Decisão do Administrador: Aprovar ou Recusar Reserva Normal
  async decidirReserva(id_reserva: number, aprovar: boolean, id_adm: number) {
    const reserva = await prisma.reserva.findUnique({
      where: { id_reserva },
      include: {
        turma: true,
        sala: true,
        reserva_docente: {
          include: {
            docente: {
              include: {
                usuario: true,
              },
            },
          },
        },
      },
    });

    if (!reserva) throw new AppError('Reserva não encontrada.', 404);
    if (reserva.status !== 'PENDENTE') throw new AppError('Apenas reservas PENDENTES podem ser validadas.', 400);

    const novoStatus = aprovar ? 'CONFIRMADA' : 'RECUSADA';

    return await prisma.$transaction(async (tx) => {
      const reservaAtualizada = await tx.reserva.update({
        where: { id_reserva },
        data: {
          status: novoStatus,
          id_admin: id_adm,
          dt_validacao: new Date(),
        },
      });

      if (aprovar) {
        // RN22: Enviar mensagem particular para a turma informando sala e docente
        const nomeDocente = reserva?.reserva_docente[0]?.docente?.usuario?.nome || 'Coordenador';
        await tx.comunicado.create({
          data: {
            titulo: 'Reserva Confirmada',
            conteudo: `Sua aula será na sala ${reserva.sala.nome}. Responsável: ${nomeDocente}.`,
            abrangencia: `TURMA`,
            id_turma: reserva.id_turma,
            id_adm,
          },
        });
      }

      return {
        reserva: reservaAtualizada,
        mensagem: aprovar ? 'Reserva Confirmada' : 'Reserva Recusada',
      };
    });
  }

  // 3. Reserva de Urgência (RN08)
  // 3. Reserva de Urgência (RN08)
  async solicitarUrgencia(dados: IReservaUrgenciaInput) {
    if (!dados.justificativa_urgencia || dados.justificativa_urgencia.trim().length < 10) {
      throw new AppError('É obrigatório fornecer uma justificativa de urgência detalhada (mínimo 10 caracteres).', 400);
    }

    if (!dados.horarios || dados.horarios.length === 0) {
      throw new AppError('É necessário fornecer os horários desejados.', 400);
    }

    // Busca a reserva confirmada existente que sofrerá o conflito de urgência
    const reservaExistente = await prisma.reserva.findFirst({
      where: {
        id_sala: dados.id_sala,
        status: 'CONFIRMADA',
        reserva_horario: {
          some: {
            id_sala_horario: { in: dados.horarios.map((h) => h.id_sala_horario) },
          },
        },
      },
    });

    if (!reservaExistente) {
      throw new AppError('Não existe uma reserva confirmada nesta sala para o horário solicitado para solicitar urgência.', 400);
    }

    // Cria a solicitação de urgência sem inserir ainda em ReservaHorario para não violar a @@unique([id_sala_horario, dt_reserva])
    return await prisma.reserva.create({
      data: {
        id_sala: dados.id_sala,
        id_turma: dados.id_turma,
        tipo: 'URGENCIA',
        status: 'PENDENTE',
        justificativa_urgencia: dados.justificativa_urgencia.trim(),
        id_reserva_urgencia: reservaExistente.id_reserva,
        reserva_docente: {
          create: { id_docente: dados.id_docente },
        },
      },
      include: {
        sala: true,
        turma: true,
        reserva_docente: true,
      },
    });
  }

  // 4. Decidir Urgência e Realocar Antigo Docente (Com validação e troca de horários)
  async decidirUrgencia(id_reserva_urgencia: number, aprovar: boolean, id_admin: number, nova_sala_antiga?: number) {
    const reservaUrgente = await prisma.reserva.findUnique({
      where: { id_reserva: id_reserva_urgencia },
      include: {
        reserva_urgencia: {
          include: {
            reserva_horario: { include: { sala_horario: true } },
          },
        },
      },
    });

    if (!reservaUrgente || reservaUrgente.tipo !== 'URGENCIA') {
      throw new AppError('Solicitação de urgência não encontrada.', 404);
    }

    if (!aprovar) {
      await prisma.reserva.update({
        where: { id_reserva: id_reserva_urgencia },
        data: { status: 'RECUSADA', id_admin, dt_validacao: new Date() },
      });
      return { mensagem: 'Solicitação de urgência recusada.' };
    }

    if (!nova_sala_antiga) {
      throw new AppError('Para aprovar a urgência, você deve indicar uma nova sala para realocar o docente anterior (RN09).', 400);
    }

    const reservaAntiga = reservaUrgente.reserva_urgencia;

    if (!reservaAntiga) {
      throw new AppError('Reserva original a ser realocada não foi encontrada.', 404);
    }

    // Validação dos horários livres na nova sala
    for (const rh of reservaAntiga.reserva_horario) {
      const idHorarioOriginal = rh.sala_horario.id_horario;
      const diaSemanaOriginal = rh.sala_horario.dia_semana;

      const salaHorarioNova = await prisma.salaHorario.findFirst({
        where: {
          id_sala: nova_sala_antiga,
          id_horario: idHorarioOriginal,
          dia_semana: diaSemanaOriginal,
          ativo: true,
        },
      });

      if (!salaHorarioNova) {
        throw new AppError('A nova sala selecionada não possui funcionamento cadastrado para os horários exigidos pelo docente anterior.', 400);
      }

      const conflitoNovaSala = await prisma.reservaHorario.findFirst({
        where: {
          id_sala_horario: salaHorarioNova.id_sala_horario,
          dt_reserva: rh.dt_reserva,
          reserva: { status: { in: ['PENDENTE', 'CONFIRMADA'] } },
        },
      });

      if (conflitoNovaSala) {
        throw new AppError('A nova sala selecionada já possui uma reserva ativa em um dos horários necessários para a realocação.', 400);
      }
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Apaga temporariamente os vínculos da reserva antiga na ReservaHorario para liberar a chave única
      const horariosOriginais = await tx.reservaHorario.findMany({
        where: { id_reserva: reservaAntiga.id_reserva },
      });

      await tx.reservaHorario.deleteMany({
        where: { id_reserva: reservaAntiga.id_reserva },
      });

      // 2. Transfere a titularidade dos horários da sala original para a nova reserva de urgência
      for (const rh of horariosOriginais) {
        await tx.reservaHorario.create({
          data: {
            id_reserva: id_reserva_urgencia,
            id_sala_horario: rh.id_sala_horario,
            dt_reserva: rh.dt_reserva,
          },
        });
      }

      // 3. Atualiza status da reserva urgente
      await tx.reserva.update({
        where: { id_reserva: id_reserva_urgencia },
        data: { status: 'CONFIRMADA', id_admin, dt_validacao: new Date() },
      });

      // 4. Realoca a reserva antiga para a nova sala e recria seus horários na nova sala
      await tx.reserva.update({
        where: { id_reserva: reservaAntiga.id_reserva },
        data: { id_sala: nova_sala_antiga },
      });

      for (const rh of reservaAntiga.reserva_horario) {
        const novaSalaHorario = await tx.salaHorario.findFirst({
          where: {
            id_sala: nova_sala_antiga,
            id_horario: rh.sala_horario.id_horario,
            dia_semana: rh.sala_horario.dia_semana,
          },
        });

        if (novaSalaHorario) {
          await tx.reservaHorario.create({
            data: {
              id_reserva: reservaAntiga.id_reserva,
              id_sala_horario: novaSalaHorario.id_sala_horario,
              dt_reserva: rh.dt_reserva,
            },
          });
        }
      }

      // 5. Registra o histórico de troca de sala
      await tx.trocaSala.create({
        data: {
          id_reserva: reservaAntiga.id_reserva,
          id_sala_origem: reservaUrgente.id_sala,
          id_sala_destino: nova_sala_antiga,
          motivo: `Realocação por Urgência: ${reservaUrgente.justificativa_urgencia}`,
        },
      });

      return { mensagem: 'Urgência aprovada! O antigo docente foi realocado com sucesso para a nova sala nos mesmos horários.' };
    });
  }

  // 5. Encerrar Reserva (RN25 - Apenas confirmação de ordem, avaria [boolean] e observações)
  async encerrarReserva(id_reserva: number, dados: IEncerrarReservaInput) {
    const { sala_em_ordem, houve_avaria, obs_encerramento } = dados;

    const reservaExistente = await prisma.reserva.findUnique({
      where: { id_reserva },
    });

    if (!reservaExistente) {
      throw new AppError('Reserva não encontrada.', 404);
    }

    return await prisma.reserva.update({
      where: { id_reserva },
      data: {
        status: 'ENCERRADA',
        sala_em_ordem: sala_em_ordem ?? true,
        // ✅ Garante que se houve_avaria for enviado como false, é gravado false (e não NULL)
        houve_avaria: houve_avaria !== undefined ? houve_avaria : false,
        obs_encerramento: obs_encerramento || null,
        dt_encerramento: new Date(),
      },
    });
  }

  // 6. Cancelar Reserva (RN07)
  async cancelarReserva(id_reserva: number) {
    const reserva = await prisma.reserva.findUnique({ where: { id_reserva } });

    if (!reserva) throw new AppError('Reserva não encontrada.', 404);
    if (reserva.status === 'ENCERRADA' || reserva.status === 'CANCELADA') {
      throw new AppError('Esta reserva já se encontra finalizada ou cancelada.', 400);
    }

    return await prisma.reserva.update({
      where: { id_reserva },
      data: { status: 'CANCELADA' },
    });
  }
}

export const reservaService = new ReservaService();