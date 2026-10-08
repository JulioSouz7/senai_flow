import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

export class UsuarioService {
  async autenticar(email: string, senha: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        docente: true,
        aluno: true,
        administrador: true,
      },
    });
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    if (usuario.senha !== senha) {
      throw new Error('Senha inválida');
    }
    
    if (usuario.status !== 'ATIVO') {
      throw new Error('Usuário inativo');
    }

    const usuarioSemSenha = { ...usuario };
    delete (usuarioSemSenha as { senha?: string }).senha;
    
    if (!usuario.senha_alterada) {
      return {
        requer_troca_senha: true,
        message: 'Primeiro acesso detectado. Altere sua senha provisória para continuar.',
        usuario: usuarioSemSenha,
      };
    }

    const secret = process.env.JWT_SECRET || 'secreto_senai_flow';

    const token = jwt.sign(
      {
        email: usuario.email,
        perfil: usuario.perfil,
        id_docente: usuario.docente?.id_docente ?? null,
      },
      secret,
      {
        subject: String(usuario.id_usuario),
        expiresIn: '8h',
      }
    );
    
    return {
      requer_troca_senha: false,
      message: 'Login realizado com sucesso',
      token,
      usuario: usuarioSemSenha,
    };
  }
  
  async alterarSenhaProvisoria(id_usuario: number, senha_atual: string, nova_senha: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario },
    });
    
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    if (usuario.senha !== senha_atual) {
      throw new Error('Senha atual incorreta');
    }

    return await prisma.usuario.update({
      where: { id_usuario },
      data: {
        senha: nova_senha,
        senha_alterada: true,
      },
      select: {
        id_usuario: true,
        nome: true,
        email: true,
        perfil: true,
        senha_alterada: true,
      },
    });
  }
  async listar() {
    return await prisma.usuario.findMany({
      select: {
        id_usuario: true,
        nome: true,
        email: true,
        perfil: true,
        status: true,
        senha_alterada: true,
        docente: true,
        aluno: true,
        administrador: true,
      },
    });
  }
}