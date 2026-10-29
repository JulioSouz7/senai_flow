import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { AppError } from '../errors/AppError'; // Ajuste o caminho se necessário

export class AdministradorService {
  async criar(dados: { nome: string; email: string; senha?: string; nif: string }) {
    // 1. Verifica se o e-mail ou NIF já existem
    const usuarioExistente = await prisma.usuario.findUnique({ where: { email: dados.email } });
    if (usuarioExistente) throw new AppError('Já existe um usuário com este e-mail.', 400);

    const nifExistente = await prisma.administrador.findUnique({ where: { nif: dados.nif } });
    if (nifExistente) throw new AppError('Já existe um administrador com este NIF.', 400);

    const senhaPura = dados.senha || 'senai123';
    const senhaHash = await bcrypt.hash(senhaPura, 8);

    // 2. Cria o Usuário e o vínculo de Administrador na mesma transação
    const novoAdmin = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nome: dados.nome,
          email: dados.email,
          senha: senhaHash,
          perfil: 'ADMINISTRADOR',
          senha_alterada: false,
          status: 'ATIVO',
        },
      });

      const administrador = await tx.administrador.create({
        data: {
          id_usuario: usuario.id_usuario,
          nif: dados.nif,
        },
      });

      // Retorna os dados combinados, sem a senha
      return {
        id_usuario: usuario.id_usuario,
        id_adm: administrador.id_adm,
        nome: usuario.nome,
        email: usuario.email,
        nif: administrador.nif,
        perfil: usuario.perfil,
      };
    });

    return novoAdmin;
  }
}