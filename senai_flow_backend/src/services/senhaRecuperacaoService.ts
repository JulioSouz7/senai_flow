import prisma from '../config/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { AppError } from '../errors/AppError';
import { enviarEmailRecuperacao } from './emailService';

export class SenhaRecuperacaoService {
  
  // 1. Solicitar recuperação: gera o token de 1h e envia o e-mail
  async solicitarRecuperacao(email: string) {
    const emailLimpo = email.toLowerCase().trim();
    const usuario = await prisma.usuario.findUnique({
      where: { email: emailLimpo },
    });

    if (!usuario) {
      return { mensagem: 'Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.' };
    }

    // 1. Gera token e salva no banco
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const dtExpiracao = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.deleteMany({
      where: { id_usuario: usuario.id_usuario },
    });

    await prisma.passwordResetToken.create({
      data: {
        id_usuario: usuario.id_usuario,
        token_hash: tokenHash,
        dt_expiracao: dtExpiracao,
      },
    });

    // 2. O envio precisa ser confirmado antes de informar que a recuperação foi solicitada.
    try {
      await enviarEmailRecuperacao(usuario.email, rawToken);
    } catch (emailError: unknown) {
      console.error('Falha ao enviar o e-mail de recuperação de senha.', emailError);
      await prisma.passwordResetToken.deleteMany({
        where: { id_usuario: usuario.id_usuario, token_hash: tokenHash },
      });
      throw new AppError('Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.', 503);
    }

    return { mensagem: 'Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.' };
  }

  // 2. Redefinir a senha confirmando o token recebido
  async redefinirSenha(rawToken: string, novaSenha: string) {
    if (!rawToken || !novaSenha) {
      throw new AppError('Token e nova senha são obrigatórios.', 400);
    }

    if (novaSenha.length < 6) {
      throw new AppError('A nova senha deve possuir no mínimo 6 caracteres.', 400);
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token_hash: tokenHash },
      include: { usuario: true },
    });

    if (!resetToken || resetToken.dt_usado || new Date() > resetToken.dt_expiracao) {
      throw new AppError('Token inválido ou expirado. Solicite uma nova recuperação.', 400);
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await prisma.$transaction([
      // Atualiza a senha do usuário
      prisma.usuario.update({
        where: { id_usuario: resetToken.id_usuario },
        data: {
          senha: novaSenhaHash,
          senha_alterada: true,
        },
      }),
      // Marca o token como usado
      prisma.passwordResetToken.update({
        where: { id_senha_reset_token: resetToken.id_senha_reset_token },
        data: { dt_usado: new Date() },
      }),
    ]);

    return { mensagem: 'Senha redefinida com sucesso!' };
  }
}

export const senhaRecuperacaoService = new SenhaRecuperacaoService();