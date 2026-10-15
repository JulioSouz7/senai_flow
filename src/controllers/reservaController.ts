import { Request, Response } from 'express';
import { ReservaService } from '../services/reservaService';

const reservaService = new ReservaService();

export class ReservaController {
  async listar(req: Request, res: Response) {
    try {
      const reservas = await reservaService.listar();
      return res.status(200).json(reservas);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reserva = await reservaService.buscarPorId(Number(id));
      return res.status(200).json(reserva);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const { id_sala, id_turma, tipo, justificativa_urgencia, id_reserva_urgencia } = req.body;

      if (!id_sala || !id_turma) {
        return res.status(400).json({
          message: 'Os campos id_sala e id_turma são obrigatórios.',
        });
      }

      const novaReserva = await reservaService.criar({
        id_sala: Number(id_sala),
        id_turma: Number(id_turma),
        tipo,
        justificativa_urgencia,
        id_reserva_urgencia: id_reserva_urgencia ? Number(id_reserva_urgencia) : undefined,
      });

      return res.status(201).json({
        message: 'Solicitação de reserva registrada com sucesso!',
        reserva: novaReserva,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async validar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body; // 'CONFIRMADA' ou 'CANCELADA'
      const id_admin = (req as any).user?.id;

      if (!status || !['CONFIRMADA', 'CANCELADA'].includes(status)) {
        return res.status(400).json({ message: "Status inválido. Use 'CONFIRMADA' ou 'CANCELADA'." });
      }

      const reservaAtualizada = await reservaService.aprovarOuRejeitar(Number(id), Number(id_admin), status);

      return res.status(200).json({
        message: `Reserva ${status.toLowerCase()} com sucesso!`,
        reserva: reservaAtualizada,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }
}