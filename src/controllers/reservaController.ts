import { Request, Response } from 'express';
import { ReservaService } from '../services/reservaService';

const reservaService = new ReservaService();

export class ReservaController {
  async listar(req: Request, res: Response) {
    try {
      const reservas = await reservaService.listar();
      return res.status(200).json(reservas);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const reserva = await reservaService.buscarPorId(Number(id));
      return res.status(200).json(reserva);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const { id_sala, id_turma, id_docente, data, hora_inicio, hora_fim, tipo } = req.body;

      if (!id_sala || !id_turma || !id_docente || !data || !hora_inicio || !hora_fim) {
        return res.status(400).json({ message: 'Dados obrigatórios ausentes para criar a reserva.' });
      }

      const novaReserva = await reservaService.criar({
        id_sala: Number(id_sala),
        id_turma: Number(id_turma),
        id_docente: Number(id_docente),
        data,
        hora_inicio,
        hora_fim,
        tipo,
      });

      return res.status(201).json({
        message: 'Reserva solicitada com sucesso!',
        reserva: novaReserva,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}