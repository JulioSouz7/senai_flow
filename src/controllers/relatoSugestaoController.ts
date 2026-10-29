import { Request, Response } from 'express';
import { RelatoSugestaoService } from '../services/relatoSugestaoService';

const relatoService = new RelatoSugestaoService();

export class RelatoSugestaoController {
  // 1. Criar Relato/Sugestão (Disponível para qualquer usuário autenticado)
  async criar(req: Request, res: Response) {
    try {
      const id_usuario = (req as any).user_id;
      const { tipo, descricao } = req.body;

      const relato = await relatoService.criarRelato(Number(id_usuario), {
        tipo,
        descricao,
      });

      return res.status(201).json({
        message: 'Relato/Sugestão enviado com sucesso!',
        relato,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        error: true,
        message: error.message || 'Erro ao criar relato/sugestão.',
      });
    }
  }

  // 2. Responder / Atualizar Status (Apenas Administradores)
  async responder(req: Request, res: Response) {
    try {
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
        message: 'Resposta e status atualizados com sucesso!',
        relato: relatoAtualizado,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        error: true,
        message: error.message || 'Erro ao responder relato.',
      });
    }
  }

  // 3. Arquivar Relato (Apenas Administradores)
  async arquivar(req: Request, res: Response) {
    try {
      const id_usuario_admin = (req as any).user_id;
      const { id } = req.params;

      const resultado = await relatoService.arquivarRelato(
        Number(id_usuario_admin),
        Number(id)
      );

      return res.status(200).json({
        message: 'Relato arquivado e encaminhado ao corporativo com sucesso!',
        data: resultado,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        error: true,
        message: error.message || 'Erro ao arquivar relato.',
      });
    }
  }

  // 4. Listar Relatos (Aplica validação dos 5 dias automaticamente)
  async listar(req: Request, res: Response) {
    try {
      const relatos = await relatoService.listarRelatos();
      return res.status(200).json(relatos);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        error: true,
        message: error.message || 'Erro ao listar relatos.',
      });
    }
  }
}