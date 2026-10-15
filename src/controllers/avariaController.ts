import { Request, Response } from 'express';
import { AvariaService } from '../services/avariaService';

const avariaService = new AvariaService();

export class AvariaController {
  async listar(req: Request, res: Response) {
    try {
      const avarias = await avariaService.listar();
      return res.status(200).json(avarias);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const avaria = await avariaService.buscarPorId(Number(id));
      return res.status(200).json(avaria);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const { id_docente, id_sala, id_equipamento, id_reserva, descricao, foto, gravidade } = req.body;

      const novaAvaria = await avariaService.criar({
        id_docente: Number(id_docente),
        id_sala: Number(id_sala),
        id_equipamento: Number(id_equipamento),
        id_reserva: id_reserva ? Number(id_reserva) : undefined,
        descricao,
        foto,
        gravidade,
      });

      return res.status(201).json({
        message: 'Avaria registrada com sucesso!',
        avaria: novaAvaria,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async atualizarStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, gravidade } = req.body;

      const avariaAtualizada = await avariaService.atualizarStatus(
        Number(id),
        status,
        gravidade
      );

      return res.status(200).json({
        message: 'Status/Gravidade da avaria atualizado com sucesso!',
        avaria: avariaAtualizada,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultado = await avariaService.deletar(Number(id));

      return res.status(200).json({
        message: 'Avaria removida com sucesso!',
        avaria: resultado,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }
}