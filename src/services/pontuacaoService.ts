import prisma from '../config/prisma';

export class PontuacaoService {
  async consultarPontuacaoTurma(id_turma: number) {
    return await prisma.pontuacao.findMany({
      where: { id_turma },
      include: { turma: true, reserva: true },
    });
  }
}