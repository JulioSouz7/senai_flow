import { Request, Response } from 'express';
import { ReservaDetalhesService } from '../services/reservaDetalhesService';

const reservaDetalhesService = new ReservaDetalhesService();

export class ReservaDetalhesController {
  async adicionarHorario(req: Request, res: Response) {
    try {
      const { id_reserva, data, hora_inicio, hora_fim } = req.body;
      const novoHorario = await reservaDetalhesService.adicionarHorario({
        id_reserva: Number(id_reserva),
        data,
        hora_inicio,
        hora_fim,
      });

      return res.status(201).json({
        message: 'Horário adicionado à reserva com sucesso!',
        horario: novoHorario,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async vincularDocente(req: Request, res: Response) {
    try {
      const { id_reserva, id_docente } = req.body;
      const novoVinculo = await reservaDetalhesService.vincularDocente(
        Number(id_reserva),
        Number(id_docente)
      );

      return res.status(201).json({
        message: 'Docente vinculado à reserva com sucesso!',
        vinculo: novoVinculo,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }
}