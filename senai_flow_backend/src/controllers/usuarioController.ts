import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuarioService';
import { AppError } from '../errors/AppError';
import { senhaRecuperacaoService } from '../services/senhaRecuperacaoService';

const usuarioService = new UsuarioService();

export class UsuarioController {

  public async alterarStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('O campo status é obrigatório.', 400);
    }

    const usuarioAtualizado = await usuarioService.alterarStatus(Number(id), status);
    return res.status(200).json({
      message: 'Status do usuário atualizado com sucesso.',
      usuario: usuarioAtualizado,
    });
  }

  async criar(req: Request, res: Response) {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !perfil) {
      throw new AppError('Os campos nome, e-mail e perfil são obrigatórios.', 400);
    }

    const novoUsuario = await usuarioService.criar({ nome, email, senha, perfil });

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso.',
      usuario: novoUsuario
    });
  }

  async listar(req: Request, res: Response) {
    const usuarios = await usuarioService.listar();
    return res.status(200).json(usuarios);
  }

  async login(req: Request, res: Response) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
    }

    // Remove espaços extras e qualquer caractere nulo acidental (\0) enviado pelo frontend
    const emailLimpo = String(email).trim().replace(/\0/g, '');
    const senhaLimpa = String(senha).trim().replace(/\0/g, '');

    const resultado = await usuarioService.autenticar(emailLimpo, senhaLimpa);
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

  async solicitarRecuperacaoSenha(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'E-mail é obrigatório.' });
    }

    const resultado = await senhaRecuperacaoService.solicitarRecuperacao(email);
    return res.status(200).json(resultado);
  }

  async redefinirSenhaRecuperacao(req: Request, res: Response) {
    const { token, nova_senha } = req.body;

    const resultado = await senhaRecuperacaoService.redefinirSenha(token, nova_senha);
    return res.status(200).json(resultado);
  }
}