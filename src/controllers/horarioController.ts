import { Request, Response } from 'express';
import { HorarioService } from '../services/horarioService';

const horarioService = new HorarioService();

export class HorarioController {
  async criar(req: Request, res: Response) {
    try {
      const { hora_inicio, hora_fim } = req.body;

      if (!hora_inicio || !hora_fim) {
        return res.status(400).json({ message: 'Campos hora_inicio e hora_fim são obrigatórios.' });
      }

      const novoHorario = await horarioService.criar(hora_inicio, hora_fim);
      return res.status(201).json({ message: 'Horário criado com sucesso!', horario: novoHorario });
    } catch (error: any) {
      console.error('Erro ao criar horário:', error);
      return res.status(500).json({ message: 'Erro interno ao criar horário.' });
    }
  }

  async listar(req: Request, res: Response) {
    try {
      const horarios = await horarioService.listar();
      return res.status(200).json(horarios);
    } catch (error: any) {
      return res.status(500).json({ message: 'Erro ao listar horários.' });
    }
  }
}