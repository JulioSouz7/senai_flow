import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

interface IHorarioInput {
  id_horario: number;
  dia_semana: number; // 1 (Segunda) a 6 (Sábado)
}

interface ICriarSalaInput {
  id_predio: number;
  nome: string;
  capacidade: number;
  qr_code: string;
  horarios: IHorarioInput[];
}

interface IAtualizarSalaInput {
  id_predio?: number;
  nome?: string;
  capacidade?: number;
  qr_code?: string;
  horarios?: IHorarioInput[];
}

export interface IFiltroSalaInput {
  nome?: string;
  tipo?: string; // Ex: "LABORATORIO", "TEORICA"
  bloco?: string;
  capacidade_minima?: number;
  capacidade?: number;
  ativa?: boolean;
  id_equipamento?: number; // Filtrar por ID do equipamento
  equipamento?: string;    // Filtrar por NOME do equipamento (ex: "Projetor")
}

export class SalaService {
  // 1. Criar Sala (Com validação e vinculação de horários)
  async criarSala(dados: ICriarSalaInput) {
    // Verificar se o prédio existe
    const predioExiste = await prisma.predio.findUnique({
      where: { id_predio: dados.id_predio },
    });

    if (!predioExiste) {
      throw new AppError('O prédio informado não foi encontrado.', 404);
    }

    // Verificar se já existe uma sala com o mesmo QR Code
    const qrCodeExistente = await prisma.sala.findUnique({
      where: { qr_code: dados.qr_code },
    });

    if (qrCodeExistente) {
      throw new AppError('Já existe uma sala cadastrada com este QR Code.', 400);
    }

    // Validar se os IDs de horário informados existem no banco
    if (dados.horarios && dados.horarios.length > 0) {
      const idsHorarios = dados.horarios.map((h) => h.id_horario);
      const horariosValidos = await prisma.horario.findMany({
        where: { id_horario: { in: idsHorarios } },
      });

      if (horariosValidos.length !== new Set(idsHorarios).size) {
        throw new AppError('Um ou mais IDs de horário fornecidos não existem no sistema.', 400);
      }
    }

    // Criar Sala e seus Horários em uma transação
    return await prisma.sala.create({
      data: {
        id_predio: dados.id_predio,
        nome: dados.nome,
        capacidade: dados.capacidade,
        qr_code: dados.qr_code,
        horarios_disponiveis: {
          create: dados.horarios.map((h) => ({
            id_horario: h.id_horario,
            dia_semana: h.dia_semana,
          })),
        },
      },
      include: {
        predio: true,
        horarios_disponiveis: {
          include: {
            horario: true,
          },
        },
      },
    });
  }

  async filtrarSalas(filtros: IFiltroSalaInput) {
    const {
      nome,
      tipo,
      bloco,
      capacidade,
      capacidade_minima,
      ativa,
      id_equipamento,
      equipamento,
    } = filtros;

    // Constrói o filtro da capacidade
    let whereCapacidade = {};
    if (capacidade !== undefined && !isNaN(capacidade)) {
      whereCapacidade = { capacidade: capacidade };
    } else if (capacidade_minima !== undefined && !isNaN(capacidade_minima)) {
      whereCapacidade = { capacidade: { gte: capacidade_minima } };
    }

    // Constrói o filtro da tabela relacional SALA_EQUIPAMENTO
    let whereEquipamento = {};
    if (id_equipamento && !isNaN(id_equipamento)) {
      whereEquipamento = {
        sala_equipamento: {
          some: {
            id_equipamento: id_equipamento,
          },
        },
      };
    } else if (equipamento) {
      whereEquipamento = {
        sala_equipamento: {
          some: {
            equipamento: {
              nome: {
                contains: equipamento,
                mode: 'insensitive',
              },
            },
          },
        },
      };
    }

    return await prisma.sala.findMany({
      where: {
        ...(nome ? { nome: { contains: nome, mode: 'insensitive' } } : {}),
        ...(tipo ? { tipo: { contains: tipo, mode: 'insensitive' } } : {}),
        ...(bloco ? { bloco: { contains: bloco, mode: 'insensitive' } } : {}),
        ...whereCapacidade,
        ...whereEquipamento,
        ...(ativa !== undefined ? { ativa } : { ativa: true }),
      },
      include: {
        predio: true,
        horarios_disponiveis: {
          include: { horario: true },
        },
        sala_equipamento: {
          include: {
            equipamento: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  // 2. Listar todas as salas ativas
  async listarSalas(id_predio?: number) {
    return await prisma.sala.findMany({
      where: {
        ativa: true,
        ...(id_predio ? { id_predio } : {}),
      },
      include: {
        predio: true,
        horarios_disponiveis: {
          include: {
            horario: true,
          },
        },
      },
    });
  }

  // 3. Buscar Sala por ID
  async buscarPorId(id_sala: number) {
    const sala = await prisma.sala.findUnique({
      where: { id_sala },
      include: {
        predio: true,
        horarios_disponiveis: {
          include: {
            horario: true,
          },
        },
      },
    });

    if (!sala) {
      throw new AppError('Sala não encontrada.', 404);
    }

    return sala;
  }

  // 4. Atualizar Sala
  async atualizarSala(id_sala: number, dados: IAtualizarSalaInput) {
    const sala = await prisma.sala.findUnique({ where: { id_sala } });

    if (!sala) {
      throw new AppError('Sala não encontrada.', 404);
    }

    if (dados.qr_code && dados.qr_code !== sala.qr_code) {
      const qrCodeExistente = await prisma.sala.findUnique({
        where: { qr_code: dados.qr_code },
      });

      if (qrCodeExistente) {
        throw new AppError('O novo QR Code fornecido já está em uso.', 400);
      }
    }

    // Atualização com recriação da grade de horários (se informada)
    return await prisma.$transaction(async (tx) => {
      if (dados.horarios) {
        // Remove horários antigos da sala
        await tx.salaHorario.deleteMany({
          where: { id_sala },
        });

        // Insere a nova lista de horários
        await tx.salaHorario.createMany({
          data: dados.horarios.map((h) => ({
            id_sala,
            id_horario: h.id_horario,
            dia_semana: h.dia_semana,
          })),
        });
      }

      return await tx.sala.update({
        where: { id_sala },
        data: {
          id_predio: dados.id_predio,
          nome: dados.nome,
          capacidade: dados.capacidade,
          qr_code: dados.qr_code,
        },
        include: {
          predio: true,
          horarios_disponiveis: {
            include: {
              horario: true,
            },
          },
        },
      });
    });
  }

  // 5. Desativar Sala (Soft Delete)
  async desativarSala(id_sala: number) {
    const sala = await prisma.sala.findUnique({ where: { id_sala } });

    if (!sala) {
      throw new AppError('Sala não encontrada.', 404);
    }

    if (!sala.ativa) {
      throw new AppError('Esta sala já se encontra desativada.', 400);
    }

    return await prisma.sala.update({
      where: { id_sala },
      data: { ativa: false },
    });
  }

  // 6. Reativar Sala
  async reativarSala(id_sala: number) {
    const sala = await prisma.sala.findUnique({ where: { id_sala } });

    if (!sala) {
      throw new AppError('Sala não encontrada.', 404);
    }

    if (sala.ativa) {
      throw new AppError('Esta sala já está ativa.', 400);
    }

    return await prisma.sala.update({
      where: { id_sala },
      data: { ativa: true },
    });
  }
}

export const salaService = new SalaService();