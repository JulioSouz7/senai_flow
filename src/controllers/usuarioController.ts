import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuarioService';

const usuarioService = new UsuarioService();

export class UsuarioController {
  async listar(req: Request, res: Response) {
    const usuarios = await usuarioService.listar();
    return res.status(200).json(usuarios);
  }

  async login(req: Request, res: Response) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
    }

    const resultado = await usuarioService.autenticar(email, senha);
    return res.status(200).json(resultado);
  }

  async alterarSenha(req: Request, res: Response) {
  // Pega exclusivamente o ID injetado pelo middleware isAuthenticated
  const userId = (req as any).user_id; 
  const { senha_atual, nova_senha } = req.body;

  if (!senha_atual || !nova_senha) {
    return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
  }

  const usuarioAtualizado = await usuarioService.alterarSenhaProvisoria(
    Number(userId),
    senha_atual,
    nova_senha
  );

  return res.status(200).json({
    message: 'Senha alterada com sucesso!',
    usuario: usuarioAtualizado,
  });
}
}