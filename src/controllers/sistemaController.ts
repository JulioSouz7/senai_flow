import { Request, Response } from 'express';
import { AvariaService } from '../services/avariaService';
import { SuporteService } from '../services/suporteService';
import { SugestaoService } from '../services/sugestaoService';
import { ComunicadoService } from '../services/comunicadoService';

const avariaService = new AvariaService();
const suporteService = new SuporteService();
const sugestaoService = new SugestaoService();
const comunicadoService = new ComunicadoService();

export class SistemaController {
  // Avarias
  async criarAvaria(req: Request, res: Response) {
    const userId = (req as any).user_id;
    const result = await avariaService.registrar({ ...req.body, id_usuario: userId });
    return res.status(201).json(result);
  }

  async listarAvarias(req: Request, res: Response) {
    const { gravidade } = req.query;
    const result = await avariaService.listarParaGestao(gravidade as string);
    return res.status(200).json(result);
  }

  // Suporte
  async abrirChamado(req: Request, res: Response) {
    const userId = (req as any).user_id;
    const { assunto, mensagem } = req.body;
    const result = await suporteService.abrirChamado(userId, assunto, mensagem);
    return res.status(201).json(result);
  }

  async responderChamado(req: Request, res: Response) {
    const { id } = req.params;
    const { resposta } = req.body;
    const adminUserId = (req as any).user_id;
    const result = await suporteService.responderChamado(Number(id), resposta, adminUserId);
    return res.status(200).json(result);
  }

  // Sugestões
  async enviarSugestao(req: Request, res: Response) {
    const userId = (req as any).user_id;
    const { tipo, descricao } = req.body;
    const result = await sugestaoService.enviarSugestao(userId, tipo, descricao);
    return res.status(201).json(result);
  }

  async arquivarSugestao(req: Request, res: Response) {
    const { id } = req.params;
    const result = await sugestaoService.arquivar(Number(id));
    return res.status(200).json(result);
  }

  // Comunicados
  async criarComunicado(req: Request, res: Response) {
    const adminUserId = (req as any).user_id;
    const { titulo, conteudo, id_turma } = req.body;
    const result = await comunicadoService.criarComunicado(adminUserId, titulo, conteudo, id_turma);
    return res.status(201).json(result);
  }

  async listarComunicados(req: Request, res: Response) {
    const { id_turma } = req.query;
    const result = await comunicadoService.listarComunicados(id_turma ? Number(id_turma) : undefined);
    return res.status(200).json(result);
  }
}