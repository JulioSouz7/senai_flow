import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class AvariaService {
  async listar() {
    return await prisma.avaria.findMany({
      include: {
        sala: { select: { id_sala: true, nome: true } },
        equipamento: { select: { id_equipamento: true, nome: true } },
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
        docente: true,
        reserva: true,
      },
    });

    if (!avaria) {
      throw new AppError('Registro de avaria não encontrado.', 404);
    }

    return avaria;
  }

  async criar(dados: {
    id_docente: number;
    id_sala: number;
    id_equipamento: number;
    id_reserva?: number;
    descricao: string;
    foto?: string;
    gravidade?: string;
  }) {
    // Regra de Negócio RN18: Descrição com no mínimo 30 caracteres
    if (!dados.descricao || dados.descricao.trim().length < 30) {
      throw new AppError('A descrição da avaria deve possuir no mínimo 30 caracteres.', 400);
    }

    if (!dados.id_docente || !dados.id_sala || !dados.id_equipamento) {
      throw new AppError('Docente, sala e equipamento são obrigatórios.', 400);
    }

    try {
      return await prisma.avaria.create({
        data: {
          id_docente: dados.id_docente,
          id_sala: dados.id_sala,
          id_equipamento: dados.id_equipamento,
          id_reserva: (dados.id_reserva ?? null) as any,
          descricao: dados.descricao,
          foto: dados.foto || '',
          gravidade: dados.gravidade || 'MEDIA',
          status: 'EM_ANALISE',
        },
        include: {
          sala: { select: { nome: true } },
          equipamento: { select: { nome: true } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('Erro ao associar chaves estrangeiras na avaria.', 400);
      }
      throw error;
    }
  }

  async atualizarStatus(id_avaria: number, status: string, gravidade?: string) {
    if (isNaN(id_avaria)) throw new AppError('ID de avaria inválido.', 400);

    const avaria = await prisma.avaria.findUnique({ where: { id_avaria } });
    if (!avaria) throw new AppError('Registro de avaria não encontrado.', 404);

    return await prisma.avaria.update({
      where: { id_avaria },
      data: {
        status: status || avaria.status,
        gravidade: gravidade || avaria.gravidade,
      },
    });
  }

  async deletar(id_avaria: number) {
    if (isNaN(id_avaria)) throw new AppError('ID de avaria inválido.', 400);

    const avaria = await prisma.avaria.findUnique({ where: { id_avaria } });
    if (!avaria) throw new AppError('Registro de avaria não encontrado.', 404);

    return await prisma.avaria.delete({
      where: { id_avaria },
      select: { id_avaria: true, descricao: true },
    });
  }
}