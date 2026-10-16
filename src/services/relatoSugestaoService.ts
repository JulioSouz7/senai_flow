import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

interface CriarRelatoInput {
  tipo: string; // "RECLAMACAO" | "SUGESTAO"
  descricao: string;
}

export class RelatoSugestaoService {
  // 1. Criar Relato/Sugestão (Livre para qualquer usuário autenticado)
  async criarRelato(id_usuario: number, data: CriarRelatoInput) {
    if (!id_usuario || isNaN(id_usuario)) {
      throw new AppError('Usuário não autenticado ou ID ausente no token.', 401);
    }

    const tipoUpper = data.tipo ? data.tipo.toUpperCase().trim() : '';
    if (!['RECLAMACAO', 'SUGESTAO'].includes(tipoUpper)) {
      throw new AppError("O tipo deve ser 'RECLAMACAO' ou 'SUGESTAO'.", 400);
    }

    if (!data.descricao || data.descricao.trim().length === 0) {
      throw new AppError('A descrição do relato/sugestão é obrigatória.', 400);
    }

    if (data.descricao.length > 255) {
      throw new AppError('A descrição não pode exceder 255 caracteres.', 400);
    }

    // Data de envio e prazo de resposta de +5 dias
    const dt_envio = new Date();
    const prazo_resposta = new Date(dt_envio);
    prazo_resposta.setDate(prazo_resposta.getDate() + 5);

    return await prisma.relatoSugestao.create({
      data: {
        id_usuario: Number(id_usuario),
        tipo: tipoUpper,
        descricao: data.descricao.trim(),
        dt_envio,
        prazo_resposta,
        status: 'PENDENTE',
        encaminhada_corporativo: false,
      },
      include: {
        usuario: { select: { id_usuario: true, nome: true, email: true } },
      },
    });
  }

  // Helper interno: Verifica e atualiza relatos expirados (prazo > 5 dias)
  private async atualizarPrazosExpirados(relato: any) {
    if (
      relato.status !== 'CORPORATIVO' &&
      relato.prazo_resposta &&
      new Date() > new Date(relato.prazo_resposta)
    ) {
      return await prisma.relatoSugestao.update({
        where: { id_relato: relato.id_relato },
        data: {
          status: 'CORPORATIVO',
          encaminhada_corporativo: true,
        },
      });
    }
    return relato;
  }

  // 2. Responder / Atualizar Status (Apenas Administradores)
  async responderRelato(
    id_usuario_admin: number,
    id_relato: number,
    status: string,
    resposta: string
  ) {
    if (!id_usuario_admin || isNaN(id_usuario_admin)) {
      throw new AppError('Usuário não autenticado ou ID ausente no token.', 401);
    }

    if (!id_relato || isNaN(id_relato)) {
      throw new AppError('ID de relato inválido.', 400);
    }

    // Regra de Indissociabilidade: status e resposta devem vir juntos
    if (!status || status.trim().length === 0) {
      throw new AppError('O status é obrigatório ao responder um relato.', 400);
    }

    if (!resposta || resposta.trim().length === 0) {
      throw new AppError('A resposta é obrigatória ao atualizar o status do relato.', 400);
    }

    if (resposta.length > 255) {
      throw new AppError('A resposta não pode exceder 255 caracteres.', 400);
    }

    const statusUpper = status.toUpperCase().trim();
    // Utiliza "CORPORATIVO" para respeitar o limite do VarChar(20)
    const statusValidos = ['ENVIADO', 'LIDO', 'CORPORATIVO'];
    if (!statusValidos.includes(statusUpper)) {
      throw new AppError(`Status inválido. Escolha entre: ${statusValidos.join(', ')}`, 400);
    }

    const admin = await prisma.administrador.findUnique({
      where: { id_usuario: Number(id_usuario_admin) },
    });

    if (!admin) {
      throw new AppError('Apenas administradores podem atualizar ou responder relatos.', 403);
    }

    const relato = await prisma.relatoSugestao.findUnique({
      where: { id_relato: Number(id_relato) },
    });

    if (!relato) {
      throw new AppError('Relato/sugestão não encontrado.', 404);
    }

    const ehCorporativo = statusUpper === 'CORPORATIVO';

    return await prisma.relatoSugestao.update({
      where: { id_relato: Number(id_relato) },
      data: {
        status: statusUpper,
        resposta: resposta.trim(),
        id_admin: Number(admin.id_adm),
        encaminhada_corporativo: ehCorporativo ? true : relato.encaminhada_corporativo,
      },
      include: {
        usuario: { select: { id_usuario: true, nome: true, email: true } },
        admin: {
          include: { usuario: { select: { nome: true, email: true } } },
        },
      },
    });
  }

  // 3. Botão "ARQUIVAR" (Apenas Administradores)
  async arquivarRelato(id_usuario_admin: number, id_relato: number) {
    if (!id_usuario_admin || isNaN(id_usuario_admin)) {
      throw new AppError('Usuário não autenticado ou ID ausente no token.', 401);
    }

    if (!id_relato || isNaN(id_relato)) {
      throw new AppError('ID de relato inválido.', 400);
    }

    const admin = await prisma.administrador.findUnique({
      where: { id_usuario: Number(id_usuario_admin) },
    });

    if (!admin) {
      throw new AppError('Apenas administradores podem arquivar relatos.', 403);
    }

    const relato = await prisma.relatoSugestao.findUnique({
      where: { id_relato: Number(id_relato) },
    });

    if (!relato) {
      throw new AppError('Relato/sugestão não encontrado.', 404);
    }

    return await prisma.$transaction(async (tx) => {
      // Atualiza o relato principal
      const relatoAtualizado = await tx.relatoSugestao.update({
        where: { id_relato: Number(id_relato) },
        data: {
          status: 'CORPORATIVO',
          encaminhada_corporativo: true,
          id_admin: Number(admin.id_adm),
        },
      });

      // Cria a gravação em RelatoHistorico (dt_registro gerado automaticamente via @default(now()))
      const historico = await tx.relatoHistorico.create({
        data: {
          id_relato: Number(id_relato),
          id_admin_status: Number(admin.id_adm),
          status: 'CORPORATIVO',
        },
      });

      return {
        relato: relatoAtualizado,
        historico,
      };
    });
  }

  // 4. Listar Relatos (com checagem de expiração dos 5 dias)
  async listarRelatos() {
    const relatos = await prisma.relatoSugestao.findMany({
      include: {
        usuario: { select: { id_usuario: true, nome: true, email: true } },
        admin: {
          include: { usuario: { select: { nome: true, email: true } } },
        },
        RelatoHistorico: true,
      },
      orderBy: { dt_envio: 'desc' },
    });

    return await Promise.all(
      relatos.map((relato) => this.atualizarPrazosExpirados(relato))
    );
  }
}