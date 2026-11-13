import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';

const dashboardService = new DashboardService();

export class DashboardController {
  async obterResumo(req: Request, res: Response) {
    const dados = await dashboardService.obterResumo();
    return res.status(200).json(dados);
  }
}