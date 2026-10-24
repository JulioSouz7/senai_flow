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
  nome_solicitante?: string;
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
  status?: string;
}

export class ReservaService {
  /**
   * Valida e resolve o ID do administrador a partir do token (id_adm ou id_usuario).
   */
  private async obterIdAdminValido(id_admin_ou_usuario: number): Promise<number> {
    const adminDireto = await prisma.administrador.findUnique({
      where: { id_adm: id_admin_ou_usuario },
    });

    if (adminDireto) {
      return adminDireto.id_adm;
    }

    const adminPorUsuario = await prisma.administrador.findUnique({
      where: { id_usuario: id_admin_ou_usuario },
    });

    if (adminPorUsuario) {
      return adminPorUsuario.id_adm;
    }

    throw new AppError('Usuário autenticado não possui um perfil de administrador cadastrado.', 403);
  }

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
      orderBy: { dt_solicitacao: 'asc' },
    });
  }

  async criarReserva(dados: ICriarReservaInput) {
    if (!dados.id_docente) {
      throw new AppError('O identificador do docente é obrigatório para esta operação.', 401);
    }

    if (!dados.horarios || dados.horarios.length === 0) {
      throw new AppError('É necessário informar ao menos um horário para efetuar a reserva.', 400);
    }

    const agora = new Date();
    for (const h of dados.horarios) {
      const dataHoraReserva = new Date(h.dt_reserva);
      const diferencaHoras = (dataHoraReserva.getTime() - agora.getTime()) / (1000 * 60 * 60);
      if (diferencaHoras < 48) {
        throw new AppError('Toda reserva deve ser solicitada com no mínimo 48 horas de antecedência.', 400);
      }
    }

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
      throw new AppError('Docente não encontrado no sistema.', 404);
    }

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

    // 🔒 NOVA CONDIÇÃO: Uma turma não pode conter duas reservas no mesmo horário e em salas diferentes
    for (const h of dados.horarios) {
      const salaHorarioAtual = await prisma.salaHorario.findUnique({
        where: { id_sala_horario: h.id_sala_horario },
      });

      if (salaHorarioAtual) {
        const conflitoTurma = await prisma.reservaHorario.findFirst({
          where: {
            dt_reserva: new Date(h.dt_reserva),
            sala_horario: {
              id_horario: salaHorarioAtual.id_horario,
              dia_semana: salaHorarioAtual.dia_semana,
            },
            reserva: {
              id_turma: dados.id_turma,
              status: { in: ['PENDENTE', 'CONFIRMADA'] },
            },
          },
        });

        if (conflitoTurma) {
          throw new AppError('A turma informada já possui uma reserva agendada para este mesmo horário em outra sala.', 400);
        }
      }

      // Validação de conflito de horários na mesma sala
      const conflitoSala = await prisma.reservaHorario.findFirst({
        where: {
          id_sala_horario: h.id_sala_horario,
          dt_reserva: new Date(h.dt_reserva),
          reserva: { status: { in: ['PENDENTE', 'CONFIRMADA'] } },
        },
      });

      if (conflitoSala) {
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
          `Horário indisponível para esta sala. Sugestão de salas alternativas com este horário vago: ${
            salasAlternativas.map((s) => s.nome).join(', ') || 'Nenhuma no momento'
          }.`,
          409
        );
      }
    }

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

  async solicitarUrgencia(dados: IReservaUrgenciaInput) {
    if (!dados.id_docente) {
      throw new AppError('O identificador do docente é obrigatório para esta operação.', 401);
    }

    if (!dados.justificativa_urgencia || dados.justificativa_urgencia.trim().length < 10) {
      throw new AppError('É obrigatório fornecer uma justificativa de urgência detalhada (mínimo 10 caracteres).', 400);
    }

    if (!dados.horarios || dados.horarios.length === 0) {
      throw new AppError('É necessário fornecer os horários desejados.', 400);
    }

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
      include: {
        reserva_docente: true,
      },
    });

    if (!reservaExistente) {
      throw new AppError('Não existe uma reserva confirmada nesta sala para o horário solicitado para solicitar urgência.', 400);
    }

    // 🔒 NOVA CONDIÇÃO: O mesmo docente não pode realizar uma reserva de urgência para a mesma sala já reservada por ele
    const docenteEhTitular = reservaExistente.reserva_docente.some(
      (rd) => rd.id_docente === dados.id_docente
    );

    if (docenteEhTitular) {
      throw new AppError('Você não pode solicitar reserva de urgência para uma sala que já está reservada por você mesmo.', 400);
    }

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

  async decidirReserva(id_reserva: number, aprovar: boolean, id_admin_ou_usuario: number) {
    const id_adm = await this.obterIdAdminValido(id_admin_ou_usuario);

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
        const nomeDocente = reserva?.reserva_docente[0]?.docente?.usuario?.nome || 'Coordenador';
        await tx.comunicado.create({
          data: {
            titulo: 'Reserva Confirmada',
            conteudo: `Sua aula será na sala ${reserva.sala.nome}. Responsável: ${nomeDocente}.`,
            abrangencia: `TURMA`,
            id_turma: reserva.id_turma,
            id_reserva: reserva.id_reserva,
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

  async decidirUrgencia(id_reserva_urgencia: number, aprovar: boolean, id_admin_ou_usuario: number, nova_sala_antiga?: number) {
    const id_admin = await this.obterIdAdminValido(id_admin_ou_usuario);

    const reservaUrgente = await prisma.reserva.findUnique({
      where: { id_reserva: id_reserva_urgencia },
      include: {
        reserva_urgencia: {
          include: {
            reserva_horario: { include: { sala_horario: true } },
          },
        },
        reserva_docente: true,
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
      const horariosOriginais = await tx.reservaHorario.findMany({
        where: { id_reserva: reservaAntiga.id_reserva },
      });

      await tx.reservaHorario.deleteMany({
        where: { id_reserva: reservaAntiga.id_reserva },
      });

      for (const rh of horariosOriginais) {
        await tx.reservaHorario.create({
          data: {
            id_reserva: id_reserva_urgencia,
            id_sala_horario: rh.id_sala_horario,
            dt_reserva: rh.dt_reserva,
          },
        });
      }

      await tx.reserva.update({
        where: { id_reserva: id_reserva_urgencia },
        data: { status: 'CONFIRMADA', id_admin, dt_validacao: new Date() },
      });

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

      const docenteSolicitante = reservaUrgente.reserva_docente[0]?.id_docente;

      await tx.trocaSala.create({
        data: {
          id_reserva: reservaAntiga.id_reserva,
          id_sala_origem: reservaUrgente.id_sala,
          id_sala_destino: nova_sala_antiga,
          id_docente_solicitante: docenteSolicitante,
          id_coordenador: id_admin,
          status: 'ACEITA',
          motivo: `Realocação por Urgência: ${reservaUrgente.justificativa_urgencia}`,
          dt_troca: new Date(),
        },
      });

      return { mensagem: 'Urgência aprovada! O antigo docente foi realocado com sucesso para a nova sala nos mesmos horários.' };
    });
  }

  async encerrarReserva(id_reserva: number, dados: IEncerrarReservaInput) {
    const { sala_em_ordem, houve_avaria, obs_encerramento } = dados;

    // 1. Busca a reserva existente
    const reservaExistente = await prisma.reserva.findUnique({
      where: { id_reserva },
    });

    if (!reservaExistente) {
      throw new AppError('Reserva não encontrada.', 404);
    }

    if (reservaExistente.status === 'ENCERRADA') {
      throw new AppError('Esta reserva já foi encerrada.', 400);
    }

    // Valores consolidados
    const emOrdem = sala_em_ordem ?? true;
    const temAvaria = houve_avaria !== undefined ? houve_avaria : false;

    // 2. Cálculo dos pontos da sala
    let pontosOrganizacao = emOrdem ? 10 : 0;
    let pontosAvaria = temAvaria ? 5 : 10;
    const totalPontos = pontosOrganizacao + pontosAvaria;

    // 3. Define o semestre letivo atual (ex: "2026/2")
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const semestre = hoje.getMonth() < 6 ? '1' : '2';
    const semestreLetivo = `${ano}/${semestre}`;

    // 4. Transação no Prisma: encerra a reserva e registra a pontuação da sala
    const [reservaEncerrada] = await prisma.$transaction([
      prisma.reserva.update({
        where: { id_reserva },
        data: {
          status: 'ENCERRADA',
          sala_em_ordem: emOrdem,
          houve_avaria: temAvaria,
          obs_encerramento: obs_encerramento || null,
          dt_encerramento: new Date(),
        },
      }),
      prisma.pontuacao.create({
        data: {
          id_reserva,
          id_sala: reservaExistente.id_sala,
          pontos: totalPontos,
          semestre_letivo: semestreLetivo,
        },
      }),
    ]);

    return reservaEncerrada;
  }

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