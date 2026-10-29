import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';

export class UsuarioService {

  async criar(dados: { nome: string; email: string; senha?: string; perfil: string }) {
    // 1. Verifica se o e-mail já existe no banco
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: dados.email },
    });

    if (usuarioExistente) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    // 2. Define uma senha padrão caso não seja enviada e aplica o hash
    // O ideal é que contas criadas administrativamente exijam a troca no primeiro acesso
    const senhaPura = dados.senha || 'senai123'; 
    const senhaHash = await bcrypt.hash(senhaPura, 8);

    // 3. Cria o usuário no banco
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha: senhaHash,
        perfil: dados.perfil,
        senha_alterada: false, // Força o usuário a trocar a senha no primeiro acesso
        status: 'ATIVO',
      },
      select: {
        // Retornamos apenas os dados seguros (sem a senha)
        id_usuario: true,
        nome: true,
        email: true,
        perfil: true,
        status: true,
        senha_alterada: true,
      },
    });

    return novoUsuario;
  }

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

    if (usuario.status !== 'ATIVO') {
      throw new Error('Usuário inativo');
    }

    // 1. Suporta tanto senhas em Hash (Bcrypt) quanto senhas legadas em texto puro
    let senhaValida = false;

    if (usuario.senha.startsWith('$2a$') || usuario.senha.startsWith('$2b$')) {
      senhaValida = await bcrypt.compare(senha, usuario.senha);
    } else {
      // Fallback caso a senha no banco tenha sido cadastrada em texto puro
      senhaValida = usuario.senha === senha;
    }

    if (!senhaValida) {
      throw new Error('Senha inválida');
    }

    const usuarioSemSenha = { ...usuario };
    delete (usuarioSemSenha as { senha?: string }).senha;

    const secret = process.env.JWT_SECRET || 'secreto_senai_flow';

    // Naipabaro ti payload ti JWT token tapno mangiraman iti id_adm, id_docente, ken id_aluno
    const token = jwt.sign(
      {
        email: usuario.email,
        perfil: usuario.perfil,
        id_docente: usuario.docente?.id_docente ?? null,
        id_adm: usuario.administrador?.id_adm ?? null,
        id_aluno: usuario.aluno?.id_aluno ?? null,
      },
      secret,
      {
        subject: String(usuario.id_usuario),
        expiresIn: '8h',
      }
    );

    if (!usuario.senha_alterada) {
      return {
        requer_troca_senha: true,
        message: 'Primeiro acesso detectado. Altere sua senha provisória para continuar.',
        token, // Token incluído para autorizar o header Bearer no Insomnia
        usuario: usuarioSemSenha,
      };
    }

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

    // Valida a senha atual (seja por hash ou texto puro)
    let senhaAtualValida = false;
    if (usuario.senha.startsWith('$2a$') || usuario.senha.startsWith('$2b$')) {
      senhaAtualValida = await bcrypt.compare(senha_atual, usuario.senha);
    } else {
      senhaAtualValida = usuario.senha === senha_atual;
    }

    if (!senhaAtualValida) {
      throw new Error('Senha atual incorreta');
    }

    // 2. Criptografa a NOVA senha em hash Bcrypt antes de salvar no banco
    const novaSenhaHash = await bcrypt.hash(nova_senha, 8);

    return await prisma.usuario.update({
      where: { id_usuario },
      data: {
        senha: novaSenhaHash,
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