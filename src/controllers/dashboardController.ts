import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';

const dashboardService = new DashboardService();

export class DashboardController {
  async obterResumo(req: Request, res: Response) {
    try {
      const dados = await dashboardService.obterResumo();
      return res.status(200).json(dados);
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ message: error.message || 'Erro ao carregar dashboard.' });
    }
  }
}