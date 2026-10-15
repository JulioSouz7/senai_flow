import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class SugestaoService {
  async enviarSugestao(id_usuario: number, tipo: string, descricao: string) {
    if (!id_usuario) {
      throw new AppError('Sugestões anônimas não são permitidas (RN17).', 400);
    }

    return await prisma.relatoSugestao.create({
      data: {
        id_usuario,
        tipo,
        descricao,
        status: 'PENDENTE',
      },
    });
  }

  async listarParaGestao() {
    return await prisma.relatoSugestao.findMany({
      where: { status: { not: 'ARQUIVADO' } },
      orderBy: { dt_envio: 'asc' },
      include: { usuario: true },
    });
  }

  async arquivar(id_relato: number) {
    return await prisma.relatoSugestao.update({
      where: { id_relato },
      data: { status: 'ARQUIVADO' },
    });
  }
}