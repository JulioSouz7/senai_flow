import { Request, Response } from 'express';
import { EquipamentoService } from '../services/equipamentoService';

const equipamentoService = new EquipamentoService();

export class EquipamentoController {
  async listar(req: Request, res: Response) {
    const equipamentos = await equipamentoService.listar();
    return res.status(200).json(equipamentos);
  }

  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;
    const equipamento = await equipamentoService.buscarPorId(Number(id));
    return res.status(200).json(equipamento);
  }

  async criar(req: Request, res: Response) {
    const { nome, descricao, nif, status } = req.body;
    if (!nome || !nif) {
      return res.status(400).json({ message: 'Nome e NIF são obrigatórios.' });
    }

    const equipamento = await equipamentoService.criar({ nome, descricao, nif, status });
    return res.status(201).json({ message: 'Equipamento cadastrado com sucesso!', equipamento });
  }

  async vincularASala(req: Request, res: Response) {
    const { id_sala, id_equipamento, quantidade } = req.body;
    if (!id_sala || !id_equipamento || !quantidade) {
      return res.status(400).json({ message: 'Informe id_sala, id_equipamento e quantidade.' });
    }

    const vinculo = await equipamentoService.vincularASala(Number(id_sala), Number(id_equipamento), Number(quantidade));
    return res.status(200).json({ message: 'Equipamento vinculado à sala com sucesso!', vinculo });
  }

  async atualizar(req: Request, res: Response) {
  const { id } = req.params;
  const { nome, descricao, nif, status } = req.body;

  const equipamentoAtualizado = await equipamentoService.atualizar(Number(id), {
    nome,
    descricao,
    nif,
    status,
  });

  return res.status(200).json({
    message: 'Equipamento atualizado com sucesso!',
    equipamento: equipamentoAtualizado,
  });
}
}