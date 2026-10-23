import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export interface ICriarPontuacaoInput {
  id_docente: number;
  pontos: number;
  semestre_letivo: string;
}

export class PontuacaoService {
  // Registrar nova pontuação
  async registrarPontuacao(dados: ICriarPontuacaoInput) {
    const { id_docente, pontos, semestre_letivo } = dados;

    if (!id_docente || isNaN(id_docente)) {
      throw new AppError('O ID do docente é obrigatório.', 400);
    }

    if (pontos === undefined || isNaN(pontos)) {
      throw new AppError('O valor dos pontos é obrigatório.', 400);
    }

    if (!semestre_letivo || !semestre_letivo.trim()) {
      throw new AppError('O semestre letivo é obrigatório.', 400);
    }

    const docenteExiste = await prisma.usuario.findUnique({
      where: { id_usuario: id_docente },
    });

    if (!docenteExiste) {
      throw new AppError('Docente não encontrado.', 404);
    }

    const novaPontuacao = await prisma.pontuacao.create({
      data: {
        id_docente,
        pontos,
        semestre_letivo: semestre_letivo.trim(),
      },
      include: {
        docente: {
          select: {
            id_usuario: true,
            nome: true,
            email: true,
          },
        },
      },
    });

    return novaPontuacao;
  }

  // Obter ranking semestral consolidado por docente
  async obterRankingSemestral(semestre_letivo: string) {
    if (!semestre_letivo || !semestre_letivo.trim()) {
      throw new AppError('O semestre letivo deve ser informado para consultar o ranking.', 400);
    }

    // Agrupa a pontuação total por docente dentro do semestre informado
    const rankingAgrupado = await prisma.pontuacao.groupBy({
      by: ['id_docente'],
      where: {
        semestre_letivo: semestre_letivo.trim(),
      },
      _sum: {
        pontos: true,
      },
      orderBy: {
        _sum: {
          pontos: 'desc',
        },
      },
    });

    // Busca os dados cadastrais dos docentes no ranking
    const rankingComDocente = await Promise.all(
      rankingAgrupado.map(async (item, index) => {
        const docente = await prisma.usuario.findUnique({
          where: { id_usuario: item.id_docente },
          select: {
            id_usuario: true,
            nome: true,
            email: true,
          },
        });

        return {
          posicao: index + 1,
          docente,
          total_pontos: item._sum.pontos || 0,
          semestre_letivo: semestre_letivo.trim(),
        };
      })
    );

    return rankingComDocente;
  }

  // Buscar histórico individual de pontuações de um docente
  async buscarHistoricoDocente(id_docente: number, semestre_letivo?: string) {
    if (!id_docente || isNaN(id_docente)) {
      throw new AppError('ID do docente inválido.', 400);
    }

    constndeClause: any = { id_docente };
    if (semestre_letivo) {
      whereClause.semestre_letivo = semestre_letivo.trim();
    }

    const historico = await prisma.pontuacao.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc',
      },
    });

    const totalPontos = historico.reduce((acc, curr) => acc + curr.pontos, 0);

    return {
      id_docente,
      total_pontos: totalPontos,
      historico,
    };
  }
}

export const pontuacaoService = new PontuacaoService();