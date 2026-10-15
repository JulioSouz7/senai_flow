import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class AreaRiscoService {
  async listar() {
    return await prisma.areaRisco.findMany({
      include: {
        predio: { select: { id_predio: true, nome: true } },
        administrador: {
          include: {
            usuario: { select: { id_usuario: true, nome: true } },
          },
        },
      },
      orderBy: { id_area: 'asc' },
    });
  }

  async buscarPorId(id_area: number) {
    if (isNaN(id_area)) throw new AppError('ID de área inválido.', 400);

    const area = await prisma.areaRisco.findUnique({
      where: { id_area },
      include: {
        predio: true,
        administrador: {
          include: {
            usuario: { select: { id_usuario: true, nome: true } },
          },
        },
      },
    });

    if (!area) throw new AppError('Área de risco não encontrada.', 404);

    return area;
  }

  async criar(dados: {
    id_predio: number;
    id_adm: number;
    nome: string;
    tipo: string;
    orientacao_seguranca: string;
    andar: number;
  }) {
    if (!dados.id_predio || !dados.id_adm || !dados.nome || !dados.tipo || !dados.orientacao_seguranca) {
      throw new AppError('Prédio, administrador, nome, tipo e orientação de segurança são obrigatórios.', 400);
    }

    try {
      return await prisma.areaRisco.create({
        data: {
          id_predio: dados.id_predio,
          id_adm: dados.id_adm,
          nome: dados.nome,
          tipo: dados.tipo,
          orientacao_seguranca: dados.orientacao_seguranca,
          andar: dados.andar ?? 0,
        },
        include: {
          predio: { select: { id_predio: true, nome: true } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('Prédio ou Administrador informado não existe no sistema.', 400);
      }
      throw error;
    }
  }

  async atualizar(
    id_area: number,
    dados: Partial<{
      nome: string;
      tipo: string;
      orientacao_seguranca: string;
      andar: number;
    }>
  ) {
    if (isNaN(id_area)) throw new AppError('ID de área inválido.', 400);

    const area = await prisma.areaRisco.findUnique({ where: { id_area } });
    if (!area) throw new AppError('Área de risco não encontrada.', 404);

    return await prisma.areaRisco.update({
      where: { id_area },
      data: dados,
    });
  }

  async deletar(id_area: number) {
    if (isNaN(id_area)) throw new AppError('ID de área inválido.', 400);

    const area = await prisma.areaRisco.findUnique({ where: { id_area } });
    if (!area) throw new AppError('Área de risco não encontrada.', 404);

    return await prisma.areaRisco.delete({ where: { id_area } });
  }
}