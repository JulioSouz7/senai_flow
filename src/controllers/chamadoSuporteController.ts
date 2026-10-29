import { Request, Response } from 'express';
import { chamadoSuporteService } from '../services/chamadoSuporteService';
import { AppError } from '../errors/AppError';

export class ChamadoSuporteController {
  // POST /chamados
  async criar(req: Request, res: Response) {
    const user = (req as any).user;
    const { assunto, descricao } = req.body;

    if (!user?.id_usuario) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const chamado = await chamadoSuporteService.criarChamado({
      id_usuario: Number(user.id_usuario),
      assunto,
      descricao,
    });

    return res.status(201).json({
      mensagem: 'Chamado de suporte aberto com sucesso!',
      chamado,
    });
  }

  // PATCH /chamados/:id/status
  async atualizarStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    const user = (req as any).user;

    if (!user?.id_usuario) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    if (!id || isNaN(Number(id))) {
      throw new AppError('O parâmetro id informado na URL é inválido.', 400);
    }

    const chamadoAtualizado = await chamadoSuporteService.atualizarStatus({
      id_chamado: Number(id),
      id_usuario_admin: Number(user.id_usuario),
      status,
    });

    return res.status(200).json({
      mensagem: 'Status do chamado atualizado com sucesso!',
      chamado: chamadoAtualizado,
    });
  }

  // GET /chamados
  async listar(req: Request, res: Response) {
    const { status, meus } = req.query;
    const user = (req as any).user;

    const idUsuarioFiltro =
      user?.perfil !== 'ADMINISTRADOR' || meus === 'true'
        ? Number(user?.id_usuario)
        : undefined;

    const chamados = await chamadoSuporteService.listarChamados(
      status ? String(status) : undefined,
      idUsuarioFiltro
    );

    return res.status(200).json(chamados);
  }

  // GET /chamados/:id
  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('O parâmetro id informado na URL é inválido.', 400);
    }

    const chamado = await chamadoSuporteService.buscarPorId(Number(id));

    return res.status(200).json(chamado);
  }
}

export const chamadoSuporteController = new ChamadoSuporteController();