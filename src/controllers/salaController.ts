import { Request, Response } from 'express';
import { SalaService } from '../services/salaService';

const salaService = new SalaService();

export class SalaController {
  async listar(req: Request, res: Response) {
    const salas = await salaService.listar();
    return res.status(200).json(salas);
  }

  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;
    const sala = await salaService.buscarPorId(Number(id));
    return res.status(200).json(sala);
  }

  async criar(req: Request, res: Response) {
    const { nome, id_predio, capacidade, qr_code } = req.body;

    if (!nome || !id_predio || !capacidade || !qr_code) {
      return res.status(400).json({ 
        message: 'Campos obrigatórios ausentes. Informe: nome, id_predio, capacidade e qr_code.' 
      });
    }

    const novaSala = await salaService.criar({
      nome,
      id_predio: Number(id_predio),
      capacidade: Number(capacidade),
      qr_code,
    });

    return res.status(201).json({
      message: 'Sala cadastrada com sucesso!',
      sala: novaSala,
    });
  }

  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const { nome, id_predio, capacidade, qr_code } = req.body;

    const salaAtualizada = await salaService.atualizar(Number(id), {
      nome,
      id_predio: id_predio ? Number(id_predio) : undefined,
      capacidade: capacidade ? Number(capacidade) : undefined,
      qr_code,
    });

    return res.status(200).json({
      message: 'Sala atualizada com sucesso!',
      sala: salaAtualizada,
    });
  }

  async desativar(req: Request, res: Response) {
    const { id } = req.params;
    const salaInativada = await salaService.desativar(Number(id));

    return res.status(200).json({
      message: 'Sala inativada com sucesso!',
      sala: salaInativada,
    });
  }

  async reativar(req: Request, res: Response) {
    const { id } = req.params;
    const salaReativada = await salaService.reativar(Number(id));

    return res.status(200).json({
      message: 'Sala reativada com sucesso!',
      sala: salaReativada,
    });
  }
}