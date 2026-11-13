import { Request, Response } from 'express';
import { avariaService } from '../services/avariaService';
import { AppError } from '../errors/AppError';

export class AvariaController {
  async registrar(req: Request, res: Response) {
    const { nif, nif_docente, qr_code_sala, sala, nif_equipamento, descricao, foto, gravidade } = req.body;
    const userLogado = (req as any).user;

    const id_usuario_logado = userLogado?.id_usuario;

    if (!id_usuario_logado) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const docNif = nif_docente || nif;
    const codigoSala = qr_code_sala || sala; // Aceita qualquer uma das chaves

    const avaria = await avariaService.registrarViaForms(
      {
        nif_docente: docNif.trim(),
        qr_code_sala: String(codigoSala).trim(),
        nif_equipamento: nif_equipamento.trim(),
        descricao,
        foto,
        gravidade,
      },
      Number(id_usuario_logado)
    );

    return res.status(201).json({
      message: 'Avaria registrada com sucesso e encaminhada ao setor responsável.',
      avaria,
    });
  }

  async listar(req: Request, res: Response) {
    const { status } = req.query;

    const avarias = await avariaService.listar(status ? String(status) : undefined);

    return res.status(200).json(avarias);
  }

  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;
    const avaria = await avariaService.buscarPorId(Number(id));
    return res.status(200).json(avaria);
  }

  async atualizarStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    const avariaAtualizada = await avariaService.atualizarStatus(Number(id), status);

    return res.status(200).json({
      message: 'Status da avaria atualizado com sucesso.',
      avaria: avariaAtualizada,
    });
  }
}

export const avariaController = new AvariaController();