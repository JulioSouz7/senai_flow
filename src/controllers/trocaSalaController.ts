import { Request, Response } from 'express';
import { TrocaSalaService } from '../services/trocaSalaService';

const trocaSalaService = new TrocaSalaService();

export class TrocaSalaController {
  async listar(req: Request, res: Response) {
    try {
      const trocas = await trocaSalaService.listar();
      return res.status(200).json(trocas);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const troca = await trocaSalaService.buscarPorId(Number(id));
      return res.status(200).json(troca);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async solicitar(req: Request, res: Response) {
    try {
      const { id_reserva, id_sala_origem, id_sala_destino, id_docente_solicitante, motivo } = req.body;

      if (!id_reserva || !id_sala_origem || !id_sala_destino || !id_docente_solicitante || !motivo) {
        return res.status(400).json({
          message: 'Os campos id_reserva, id_sala_origem, id_sala_destino, id_docente_solicitante e motivo são obrigatórios.',
        });
      }

      const novaTroca = await trocaSalaService.solicitar({
        id_reserva: Number(id_reserva),
        id_sala_origem: Number(id_sala_origem),
        id_sala_destino: Number(id_sala_destino),
        id_docente_solicitante: Number(id_docente_solicitante),
        motivo,
      });

      return res.status(201).json({
        message: 'Solicitação de troca enviada ao docente com sucesso!',
        troca: novaTroca,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async responder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'ACEITA' ou 'RECUSADA' (ou 'APROVADA' / 'REJEITADA')

      if (!status || !['ACEITA', 'RECUSADA', 'APROVADA', 'REJEITADA'].includes(status)) {
        return res.status(400).json({
          message: "Status inválido. Utilize 'ACEITA' ou 'RECUSADA'.",
        });
      }

      const trocaAtualizada = await trocaSalaService.responderEntreDocentes(
        Number(id),
        status
      );

      return res.status(200).json({
        message: `A solicitação de troca de sala foi ${status.toLowerCase()} pelo docente!`,
        troca: trocaAtualizada,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }
}