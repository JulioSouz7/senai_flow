import { Request, Response } from 'express';
import { PredioService } from '../services/predioService';

const predioService = new PredioService();

export class PredioController {
  async listar(req: Request, res: Response) {
    const predios = await predioService.listar();
    return res.status(200).json(predios);
  }

  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;
    const predio = await predioService.buscarPorId(Number(id));
    return res.status(200).json(predio);
  }

  async criar(req: Request, res: Response) {
    const { nome } = req.body;
    if (!nome) {
      return res.status(400).json({ message: 'O nome do prédio é obrigatório.' });
    }

    const novoPredio = await predioService.criar(nome);
    return res.status(201).json({ message: 'Prédio cadastrado com sucesso!', predio: novoPredio });
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const { nome } = req.body;

    const predioAtualizado = await predioService.atualizar(Number(id), nome);
    return res.status(200).json({ message: 'Prédio atualizado com sucesso!', predio: predioAtualizado });
  }
}