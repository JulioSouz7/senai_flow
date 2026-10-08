import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuarioService';

const usuarioService = new UsuarioService();

export class UsuarioController {
  async listar(req: Request, res: Response) {
    try {
      const usuarios = await usuarioService.listar();
      return res.status(200).json(usuarios);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
      }

      const resultado = await usuarioService.autenticar(email, senha);
      return res.status(200).json(resultado);
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }

  async alterarSenha(req: Request, res: Response) {
    try {
      const { id_usuario, senha_atual, nova_senha } = req.body;

      if (!id_usuario || !senha_atual || !nova_senha) {
        return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
      }

      const usuarioAtualizado = await usuarioService.alterarSenhaProvisoria(
        Number(id_usuario),
        senha_atual,
        nova_senha
      );

      return res.status(200).json({
        message: 'Senha alterada com sucesso!',
        usuario: usuarioAtualizado,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}