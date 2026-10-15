import { Request, Response } from 'express';
import { SugestaoService } from '../services/sugestaoService';

const sugestaoService = new SugestaoService();

export class SugestaoController {
  async listar(req: Request, res: Response) {
    try {
      const relatos = await sugestaoService.listar();
      return res.status(200).json(relatos);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const relato = await sugestaoService.buscarPorId(Number(id));
      return res.status(200).json(relato);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const { id_usuario, tipo, descricao, encaminhada_corporativo } = req.body;
      const usuarioLogadoId = (req as any).user?.id || id_usuario;

      if (!usuarioLogadoId || !descricao) {
        return res.status(400).json({
          message: 'Os campos id_usuario e descricao são obrigatórios.',
        });
      }

      const novoRelato = await sugestaoService.criar({
        id_usuario: Number(usuarioLogadoId),
        tipo,
        descricao,
        encaminhada_corporativo,
      });

      return res.status(201).json({
        message: 'Relato/Sugestão registrado com sucesso!',
        relato: novoRelato,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async responder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { resposta, status, id_admin } = req.body;
      const adminLogadoId = (req as any).user?.id || id_admin;

      if (!resposta || !adminLogadoId) {
        return res.status(400).json({ message: 'Os campos resposta e id_admin são obrigatórios.' });
      }

      const relatoAtualizado = await sugestaoService.responder(
        Number(id),
        resposta,
        status,
        Number(adminLogadoId)
      );

      return res.status(200).json({
        message: 'Relato/Sugestão respondido/arquivado com sucesso!',
        relato: relatoAtualizado,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }
}