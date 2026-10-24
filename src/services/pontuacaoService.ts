import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class PontuacaoService {
  // Obter o ranking das salas mais organizadas no semestre
  async obterRankingSalas(semestre_letivo?: string) {
    // Caso não envie o semestre, pega o atual
    const semestreBusca = semestre_letivo || this.obterSemestreAtual();

    if (!semestreBusca || !semestreBusca.trim()) {
      throw new AppError('O semestre letivo deve ser informado no formato AAAA/S (ex: 2026/1).', 400);
    }

    // Agrupa a pontuação total por sala no semestre informado
    const rankingAgrupado = await prisma.pontuacao.groupBy({
      by: ['id_sala'],
      where: {
        semestre_letivo: semestreBusca.trim(),
      },
      _sum: {
        pontos: true,
      },
      _count: {
        id_pontuacao: true, // Total de avaliações no semestre
      },
      orderBy: {
        _sum: {
          pontos: 'desc',
        },
      },
    });

    // Anexa os detalhes das salas ao ranking
    const rankingComDetalhes = await Promise.all(
      rankingAgrupado.map(async (item, index) => {
        const sala = await prisma.sala.findUnique({
          where: { id_sala: item.id_sala },
          include: {
            predio: {
              select: {
                nome: true,
              },
            },
          },
        });

        return {
          posicao: index + 1,
          id_sala: item.id_sala,
          nome_sala: sala?.nome || 'Sala Removida',
          predio: sala?.predio?.nome || 'N/A',
          total_pontos: item._sum.pontos || 0,
          total_avaliacoes: item._count.id_pontuacao,
          semestre_letivo: semestreBusca.trim(),
        };
      })
    );

    return rankingComDetalhes;
  }

  // Buscar o histórico detalhado de pontuações de uma sala específica
  async buscarHistoricoSala(id_sala: number, semestre_letivo?: string) {
    if (!id_sala || isNaN(id_sala) || id_sala <= 0) {
      throw new AppError('O ID da sala deve ser um número inteiro positivo.', 400);
    }

    const salaExiste = await prisma.sala.findUnique({
      where: { id_sala },
    });

    if (!salaExiste) {
      throw new AppError('Sala não encontrada.', 404);
    }

    const whereCondition: any = { id_sala };
    if (semestre_letivo) {
      whereCondition.semestre_letivo = semestre_letivo.trim();
    }

    const historico = await prisma.pontuacao.findMany({
      where: whereCondition,
      include: {
        reserva: {
          select: {
            dt_encerramento: true,
            sala_em_ordem: true,
            houve_avaria: true,
            obs_encerramento: true,
          },
        },
      },
      orderBy: {
        id_pontuacao: 'desc',
      },
    });

    const totalPontos = historico.reduce((acc, item) => acc + item.pontos, 0);

    return {
      id_sala,
      nome_sala: salaExiste.nome,
      total_pontos: totalPontos,
      semestre_letivo: semestre_letivo || 'TODOS',
      historico,
    };
  }

  private obterSemestreAtual(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const semestre = hoje.getMonth() < 6 ? '1' : '2';
    return `${ano}/${semestre}`;
  }
}

export const pontuacaoService = new PontuacaoService();