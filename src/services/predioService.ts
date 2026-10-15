import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class PredioService {
  async listar() {
    return await prisma.predio.findMany({
      include: { salas: true },
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id_predio: number) {
    const predio = await prisma.predio.findUnique({
      where: { id_predio },
      include: { salas: true },
    });

    if (!predio) {
      throw new AppError('Prédio não encontrado', 404);
    }

    return predio;
  }

  async criar(nome: string) {
    return await prisma.predio.create({
      data: { nome },
    });
  }

  async atualizar(id_predio: number, nome: string) {
    const predio = await prisma.predio.findUnique({ where: { id_predio } });
    if (!predio) {
      throw new AppError('Prédio não encontrado', 404);
    }

    return await prisma.predio.update({
      where: { id_predio },
      data: { nome },
    });
  }
}