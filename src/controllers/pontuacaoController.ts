import { Request, Response } from 'express';
import { pontuacaoService } from '../services/pontuacaoService';
import { AppError } from '../errors/AppError';

export class PontuacaoController {
  // GET /pontuacoes/ranking?semestre_letivo=2026/1
  async ranking(req: Request, res: Response) {
    const { semestre_letivo } = req.query;

    if (semestre_letivo !== undefined && typeof semestre_letivo !== 'string') {
      throw new AppError('O parâmetro semestre_letivo deve ser um texto válido (ex: 2026/1).', 400);
    }

    const ranking = await pontuacaoService.obterRankingSalas(
      semestre_letivo ? String(semestre_letivo) : undefined
    );

    return res.status(200).json(ranking);
  }

  // GET /pontuacoes/sala/:id_sala?semestre_letivo=2026/1
  async historicoSala(req: Request, res: Response) {
    const { id_sala } = req.params;
    const { semestre_letivo } = req.query;

    if (!id_sala || isNaN(Number(id_sala))) {
      throw new AppError('O parâmetro id_sala informado na URL é inválido.', 400);
    }

    const historico = await pontuacaoService.buscarHistoricoSala(
      Number(id_sala),
      semestre_letivo ? String(semestre_letivo) : undefined
    );

    return res.status(200).json(historico);
  }
}

export const pontuacaoController = new PontuacaoController();