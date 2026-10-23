import { Request, Response } from 'express';
import { pontuacaoService } from '../services/pontuacaoService';
import { AppError } from '../errors/AppError';

export class PontuacaoController {
  // Obter ranking semestral
  async obterRanking(req: Request, res: Response) {
    const { semestre_letivo } = req.query;

    if (!semestre_letivo || typeof semestre_letivo !== 'string') {
      throw new AppError('O parâmetro query semestre_letivo (ex: 2026/1) é obrigatório.', 400);
    }

    const ranking = await pontuacaoService.obterRankingSemestral(semestre_letivo);

    return res.status(200).json(ranking);
  }

  // Buscar histórico de pontuações do docente
  async buscarHistoricoDocente(req: Request, res: Response) {
    const { id_docente } = req.params;
    const { semestre_letivo } = req.query;

    if (!id_docente || isNaN(Number(id_docente))) {
      throw new AppError('O ID do docente informado na URL é inválido.', 400);
    }

    const historico = await pontuacaoService.buscarHistoricoDocente(
      Number(id_docente),
      semestre_letivo ? String(semestre_letivo) : undefined
    );

    return res.status(200).json(historico);
  }

  // Registrar pontuação manual (caso necessário via backoffice/admin)
  async registrar(req: Request, res: Response) {
    const { id_docente, pontos, semestre_letivo } = req.body;

    const novaPontuacao = await pontuacaoService.registrarPontuacao({
      id_docente: Number(id_docente),
      pontos: Number(pontos),
      semestre_letivo: String(semestre_letivo),
    });

    return res.status(201).json(novaPontuacao);
  }
}

export const pontuacaoController = new PontuacaoController();