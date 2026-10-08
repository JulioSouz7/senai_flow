import { Request, Response } from 'express';
import { SalaService } from '../services/salaService';

const salaService = new SalaService();

export class SalaController {
  async listar(req: Request, res: Response) {
    try {
      const salas = await salaService.listarTodas();
      return res.status(200).json(salas);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const { id_predio, nome, capacidade, qr_code } = req.body;
      const novaSala = await salaService.criar({ id_predio, nome, capacidade, qr_code });
      return res.status(201).json(novaSala);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}