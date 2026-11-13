import { Request, Response } from 'express';
import { RelatoSugestaoService } from '../services/relatoSugestaoService';

const relatoService = new RelatoSugestaoService();

export class RelatoSugestaoController {
  // 1. Criar Relato/Sugestão (Disponível para qualquer usuário autenticado)
  async criar(req: Request, res: Response) {
    const id_usuario = (req as any).user_id;
    const { tipo, descricao } = req.body;

    const relato = await relatoService.criarRelato(Number(id_usuario), {
      tipo,
      descricao,
    });

    return res.status(201).json({
      message: 'Relato ou sugestão enviado com sucesso.',
      relato,
    });
  }

  async buscarPorIdUsuario(req: Request, res: Response) {
    const { id_usuario } = req.params;
    const relatos = await relatoService.buscarPorIdUsuario(Number(id_usuario));

    return res.status(200).json(relatos);
  }

  // 2. Responder / Atualizar Status (Apenas Administradores)
  async responder(req: Request, res: Response) {
    const id_usuario_admin = (req as any).user_id;
    const { id } = req.params;
    const { status, resposta } = req.body;

    const relatoAtualizado = await relatoService.responderRelato(
      Number(id_usuario_admin),
      Number(id),
      status,
      resposta
    );

    return res.status(200).json({
      message: 'Resposta registrada e status do relato atualizado.',
      relato: relatoAtualizado,
    });
  }

  // 3. Arquivar Relato (Apenas Administradores)
  async arquivar(req: Request, res: Response) {
    const id_usuario_admin = (req as any).user_id;
    const { id } = req.params;

    const resultado = await relatoService.arquivarRelato(
      Number(id_usuario_admin),
      Number(id)
    );

    return res.status(200).json({
      message: 'Relato arquivado e encaminhado ao corporativo.',
      data: resultado,
    });
  }

  // 4. Listar Relatos (Aplica validação dos 5 dias automaticamente)
  async listar(req: Request, res: Response) {
    const relatos = await relatoService.listarRelatos();
    return res.status(200).json(relatos);
  }
}