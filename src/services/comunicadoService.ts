import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class ComunicadoService {
  async listar() {
    return await prisma.comunicado.findMany({
      include: {
        turma: { select: { id_turma: true, nome: true, curso: true } },
      },
      orderBy: { dt_publicacao: 'desc' },
    });
  }

  async buscarPorId(id_comunicado: number) {
    if (isNaN(id_comunicado)) throw new AppError('ID de comunicado inválido.', 400);

    const comunicado = await prisma.comunicado.findUnique({
      where: { id_comunicado },
      include: {
        turma: true,
      },
    });

    if (!comunicado) {
      throw new AppError('Comunicado não encontrado.', 404);
    }

    return comunicado;
  }

  async criar(dados: {
    id_adm: number;
    id_turma?: number;
    id_reserva?: number;
    titulo: string;
    conteudo: string;
    abrangencia?: string;
    publico_alvo?: string;
  }) {
    if (!dados.titulo || !dados.conteudo) {
      throw new AppError('Título e conteúdo são obrigatórios.', 400);
    }

    if (dados.id_turma) {
      const turma = await prisma.turma.findUnique({ where: { id_turma: dados.id_turma } });
      if (!turma) throw new AppError('Turma informada não existe.', 404);
    }

    try {
      return await prisma.comunicado.create({
        data: {
          id_adm: dados.id_adm,
          id_turma: (dados.id_turma ?? null) as any,
          id_reserva: (dados.id_reserva ?? null) as any,
          titulo: dados.titulo,
          conteudo: dados.conteudo,
          abrangencia: dados.abrangencia || (dados.id_turma ? 'TURMA' : 'GERAL'),
          publico_alvo: dados.publico_alvo || 'Toda a instituição',
          dt_publicacao: new Date(),
        },
        include: {
          turma: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('Erro ao associar chaves estrangeiras no comunicado.', 400);
      }
      throw error;
    }
  }

  async deletar(id_comunicado: number) {
    if (isNaN(id_comunicado)) throw new AppError('ID de comunicado inválido.', 400);

    const comunicado = await prisma.comunicado.findUnique({ where: { id_comunicado } });
    if (!comunicado) throw new AppError('Comunicado não encontrado.', 404);

    return await prisma.comunicado.delete({
      where: { id_comunicado },
      select: { id_comunicado: true, titulo: true },
    });
  }
}