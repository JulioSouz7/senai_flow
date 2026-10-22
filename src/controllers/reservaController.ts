import { Request, Response } from 'express';
import { reservaService } from '../services/reservaService';
import { AppError } from '../errors/AppError';

export class ReservaController {
  // Solicitacao de Reserva Normal
  async criar(req: Request, res: Response) {
    const { id_sala, id_turma, id_docente, horarios } = req.body;
    const nome_solicitante = (req as any).user?.nome || 'Docente/Coordenador';

    if (!id_sala || !id_turma || !id_docente) {
      throw new AppError('id_sala, id_turma e id_docente são obrigatórios.', 400);
    }

    const resultado = await reservaService.criarReserva({
      id_sala: Number(id_sala),
      id_turma: Number(id_turma),
      id_docente: Number(id_docente),
      nome_solicitante,
      horarios,
    });

    return res.status(201).json(resultado);
  }

  // Decisão do Administrador
  async decidir(req: Request, res: Response) {
    const { id } = req.params;
    const { aprovar } = req.body;
    const id_admin = (req as any).user?.id_adm;

    if (!id_admin) throw new AppError('Acesso restrito para administradores.', 403);

    const resultado = await reservaService.decidirReserva(Number(id), Boolean(aprovar), Number(id_admin));
    return res.status(200).json(resultado);
  }

  // Solicitar Urgência
  async solicitarUrgencia(req: Request, res: Response) {
    const { id_sala, id_turma, id_docente, horarios, justificativa_urgencia } = req.body;
    const nome_solicitante = (req as any).user?.nome || 'Docente';

    const resultado = await reservaService.solicitarUrgencia({
      id_sala: Number(id_sala),
      id_turma: Number(id_turma),
      id_docente: Number(id_docente),
      nome_solicitante,
      horarios,
      justificativa_urgencia,
    });

    return res.status(201).json(resultado);
  }

  // GET /reservas/pendentes
  async listarPendentes(req: Request, res: Response) {
    const reservasPendentes = await reservaService.listarPendentes();
    return res.status(200).json(reservasPendentes);
  }

  // Listar Reservas com Query Params
  async listar(req: Request, res: Response) {
    const { id_sala, id_turma, id_docente, status } = req.query;

    const reservas = await reservaService.listarReservas({
      id_sala: id_sala ? Number(id_sala) : undefined,
      id_turma: id_turma ? Number(id_turma) : undefined,
      id_docente: id_docente ? Number(id_docente) : undefined,
      status: status ? String(status).toUpperCase() : undefined,
    });

    return res.status(200).json(reservas);
  }

  // Decidir Urgência e Realocar (Admin)
  async decidirUrgencia(req: Request, res: Response) {
    const { id } = req.params;
    const { aprovar, nova_sala_antiga } = req.body;
    const id_admin = (req as any).user?.id_adm;

    if (!id_admin) throw new AppError('Acesso restrito para administradores.', 403);

    const resultado = await reservaService.decidirUrgencia(
      Number(id),
      Boolean(aprovar),
      Number(id_admin),
      nova_sala_antiga ? Number(nova_sala_antiga) : undefined
    );

    return res.status(200).json(resultado);
  }

  // Encerrar Reserva (Formulário com Sim/Não)
  async encerrar(req: Request, res: Response) {
    const { id } = req.params;
    const { sala_em_ordem, houve_avaria, obs_encerramento } = req.body;

    const reservaEncerrada = await reservaService.encerrarReserva(Number(id), {
      sala_em_ordem: Boolean(sala_em_ordem),
      houve_avaria: houve_avaria !== undefined ? Boolean(houve_avaria) : false,
      obs_encerramento: obs_encerramento ? String(obs_encerramento) : undefined,
    });

    return res.status(200).json(reservaEncerrada);
  }

  // Cancelar Reserva
  async cancelar(req: Request, res: Response) {
    const { id } = req.params;
    await reservaService.cancelarReserva(Number(id));
    return res.status(200).json({ mensagem: 'Reserva cancelada com sucesso.' });
  }
}

export const reservaController = new ReservaController();