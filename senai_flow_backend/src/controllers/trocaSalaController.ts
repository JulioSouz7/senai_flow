import { Request, Response } from 'express';
import { trocaSalaService } from '../services/trocaSalaService';
import { AppError } from '../errors/AppError';

export class TrocaSalaController {
  async listar(req: Request, res: Response) {
    const trocas = await trocaSalaService.listar();
    return res.status(200).json(trocas);
  }

  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;
    const troca = await trocaSalaService.buscarPorId(Number(id));
    return res.status(200).json(troca);
  }

  async solicitar(req: Request, res: Response) {
    const { id_reserva_origem, id_reserva_destino, motivo } = req.body;
    
    const userLogado = (req as any).user;
    const id_docente_solicitante = userLogado?.id_docente || userLogado?.id_usuario;

    if (!id_docente_solicitante) {
      throw new AppError('O usuário autenticado não possui um perfil de docente válido.', 403);
    }

    const troca = await trocaSalaService.solicitar({
      id_reserva_origem: Number(id_reserva_origem),
      id_reserva_destino: Number(id_reserva_destino),
      id_docente_solicitante: Number(id_docente_solicitante),
      motivo,
    });

    return res.status(201).json(troca);
  }

  async responder(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    const userLogado = (req as any).user;
    const id_docente_destinatario = userLogado?.id_docente || userLogado?.id_usuario;

    if (!id_docente_destinatario) {
      throw new AppError('O usuário autenticado não possui um perfil de docente válido.', 403);
    }

    const resposta = await trocaSalaService.responderEntreDocentes(
      Number(id),
      Number(id_docente_destinatario),
      status
    );

    return res.status(200).json(resposta);
  }

  async cancelar(req: Request, res: Response) {
  const { id } = req.params;

  const userLogado = (req as any).user;
  const id_docente_solicitante = userLogado?.id_docente || userLogado?.id_usuario;

  if (!id_docente_solicitante) {
    throw new AppError('O usuário autenticado não possui um perfil de docente válido.', 403);
  }

  const resultado = await trocaSalaService.cancelar(
    Number(id),
    Number(id_docente_solicitante)
  );

  return res.status(200).json({
    message: 'Solicitação de troca de sala cancelada com sucesso.',
    troca: resultado,
  });
}
}

export const trocaSalaController = new TrocaSalaController();