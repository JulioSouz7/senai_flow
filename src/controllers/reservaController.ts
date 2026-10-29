import { Request, Response } from 'express';
import { reservaService } from '../services/reservaService';
import { AppError } from '../errors/AppError';

export class ReservaController {
  async criarReserva(req: Request, res: Response) {
    const { id_sala, id_turma, horarios } = req.body;

    const userLogado = (req as any).user;
    const id_docente = userLogado?.id_docente || userLogado?.id_usuario;

    if (!id_docente) {
      throw new AppError('Usuário autenticado não possui perfil de docente válido.', 403);
    }

    const resultado = await reservaService.criarReserva({
      id_sala: Number(id_sala),
      id_turma: Number(id_turma),
      id_docente: Number(id_docente),
      nome_solicitante: userLogado?.nome,
      horarios,
    });

    return res.status(201).json(resultado);
  }

  async solicitarUrgencia(req: Request, res: Response) {
    const { id_sala, id_turma, horarios, justificativa_urgencia } = req.body;

    const userLogado = (req as any).user;
    const id_docente = userLogado?.id_docente || userLogado?.id_usuario;

    if (!id_docente) {
      throw new AppError('Usuário autenticado não possui perfil de docente válido.', 403);
    }

    const resultado = await reservaService.solicitarUrgencia({
      id_sala: Number(id_sala),
      id_turma: Number(id_turma),
      id_docente: Number(id_docente),
      horarios,
      justificativa_urgencia,
    });

    return res.status(201).json(resultado);
  }

  async decidir(req: Request, res: Response) {
    const { id } = req.params;
    const { aprovar } = req.body;

    const userLogado = (req as any).user;
    const id_admin = userLogado?.id_adm || userLogado?.id_usuario;

    if (!id_admin) throw new AppError('Acesso restrito para administradores.', 403);

    const resultado = await reservaService.decidirReserva(Number(id), Boolean(aprovar), Number(id_admin));
    return res.status(200).json(resultado);
  }

  async listarPendentes(req: Request, res: Response) {
    const reservasPendentes = await reservaService.listarPendentes();
    return res.status(200).json(reservasPendentes);
  }

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

  async decidirUrgencia(req: Request, res: Response) {
    const { id } = req.params;
    const { aprovar, nova_sala_antiga } = req.body;

    const userLogado = (req as any).user;
    const id_admin = userLogado?.id_adm || userLogado?.id_usuario;

    if (!id_admin) throw new AppError('Acesso restrito para administradores.', 403);

    const resultado = await reservaService.decidirUrgencia(
      Number(id),
      Boolean(aprovar),
      Number(id_admin),
      nova_sala_antiga ? Number(nova_sala_antiga) : undefined
    );

    return res.status(200).json(resultado);
  }

  async encerrar(req: Request, res: Response) {
    const { id } = req.params;
    const { sala_em_ordem, houve_avaria, obs_encerramento } = req.body;

    const reservaEncerrada = await reservaService.encerrarReserva(Number(id), {
      sala_em_ordem: Boolean(sala_em_ordem),
      houve_avaria: houve_avaria !== undefined ? Boolean(houve_avaria) : false,
      obs_encerramento: obs_encerramento ? String(obs_encerramento) : undefined,
    });

    return res.status(200).json({
      mensagem: 'Reserva encerrada com sucesso!',
      reserva: reservaEncerrada,
    })
  }

  async cancelar(req: Request, res: Response) {
    const { id } = req.params;
    await reservaService.cancelarReserva(Number(id));
    return res.status(200).json({ mensagem: 'Reserva cancelada com sucesso.' });
  }
}

export const reservaController = new ReservaController();