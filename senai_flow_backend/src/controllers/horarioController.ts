import { Request, Response } from 'express';
import { HorarioService } from '../services/horarioService';
import { AppError } from '../errors/AppError';

const horarioService = new HorarioService();

export class HorarioController {
  async criar(req: Request, res: Response) {
    const { hora_inicio, hora_fim } = req.body;

    if (!hora_inicio || !hora_fim) {
      throw new AppError('Informe os horários de início e fim.', 400);
    }

    const novoHorario = await horarioService.criar(hora_inicio, hora_fim);
    return res.status(201).json({ message: 'Horário cadastrado com sucesso.', horario: novoHorario });
  }

  async listar(req: Request, res: Response) {
    const horarios = await horarioService.listar();
    return res.status(200).json(horarios);
  }
}