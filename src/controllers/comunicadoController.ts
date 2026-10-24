import { Request, Response } from 'express';
import { comunicadoService } from '../services/comunicadoService';
import { AppError } from '../errors/AppError';

export class ComunicadoController {
  // POST /comunicados (Criar comunicado Geral ou Restrito por id_turma)
  async criar(req: Request, res: Response) {
    const user = (req as any).user;
    const { id_turma, titulo, conteudo, publico_alvo } = req.body;

    const id_admin_ou_usuario = user?.id_adm || user?.id_usuario;

    if (!id_admin_ou_usuario) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const novoComunicado = await comunicadoService.criar({
      id_admin_ou_usuario: Number(id_admin_ou_usuario),
      id_turma: id_turma ? Number(id_turma) : undefined,
      titulo,
      conteudo,
      publico_alvo,
    });

    return res.status(201).json({
      mensagem: 'Comunicado publicado com sucesso!',
      comunicado: novoComunicado,
    });
  }

  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;
    const comunicado = await comunicadoService.buscarPorId(Number(id));
    return res.status(200).json(comunicado);
  }

  // GET /comunicados (Listar apenas comunicados gerais)
  async listarGerais(req: Request, res: Response) {
    const comunicados = await comunicadoService.listarGerais();
    return res.status(200).json(comunicados);
  }

  // GET /comunicados/minha-turma (Sessão Minha Turma)
  async buscarMinhaTurma(req: Request, res: Response) {
    const user = (req as any).user;

    if (!user?.id_usuario) {
      throw new AppError('Usuário não autenticado.', 401);
    }

    const sessaoMinhaTurma = await comunicadoService.obterSessaoMinhaTurma(Number(user.id_usuario));
    return res.status(200).json(sessaoMinhaTurma);
  }

  // DELETE /comunicados/:id
  async deletar(req: Request, res: Response) {
    const { id } = req.params;
    const resultado = await comunicadoService.deletar(Number(id));

    return res.status(200).json({
      mensagem: 'Comunicado removido com sucesso!',
      comunicado: resultado,
    });
  }
}

export const comunicadoController = new ComunicadoController();