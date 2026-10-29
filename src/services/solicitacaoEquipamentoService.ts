import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

interface ItemSolicitacaoInput {
  id_equipamento: number;
  quantidade: number;
}

export class SolicitacaoEquipamentoService {
  // 1. Docente cria a solicitação vinculada a uma Reserva
  async criarSolicitacao(id_usuario_docente: number, id_reserva: number, itens: ItemSolicitacaoInput[]) {
    if (!id_usuario_docente || isNaN(id_usuario_docente)) {
      throw new AppError('Identificação de usuário inválida ou ausente no token.', 401);
    }

    if (!id_reserva || isNaN(id_reserva)) {
      throw new AppError('A solicitação precisa estar vinculada a uma reserva válida.', 400);
    }

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      throw new AppError('Informe pelo menos um equipamento na solicitação.', 400);
    }

    // Busca o perfil de Docente do usuário logado
    const docente = await prisma.docente.findUnique({
      where: { id_usuario: Number(id_usuario_docente) },
    });

    if (!docente) {
      throw new AppError('O usuário autenticado não possui perfil de Docente cadastrado.', 403);
    }

    // Verifica se a Reserva existe
    const reservaExiste = await prisma.reserva.findUnique({
      where: { id_reserva: Number(id_reserva) },
      include: {
        sala: true, // Traz os dados da Sala vinculada a essa reserva
      },
    });

    if (!reservaExiste) {
      throw new AppError('Reserva informada não encontrada.', 404);
    }

    // Transação atômica para salvar a solicitação e seus itens
    return await prisma.$transaction(async (tx) => {
      return await tx.solicitacaoEquipamento.create({
        data: {
          id_reserva: Number(id_reserva),
          id_docente: docente.id_docente,
          status: 'PENDENTE',
          dt_solicitacao: new Date(),
          itens: {
            create: itens.map((item) => ({
              id_equipamento: Number(item.id_equipamento),
              quantidade: Number(item.quantidade) || 1,
            })),
          },
        },
        include: {
          reserva: {
            include: {
              sala: true, // Inclui a Sala do destino na resposta
            },
          },
          itens: {
            include: { equipamento: true },
          },
        },
      });
    });
  }

  // 2. Listar solicitações trazendo a Reserva e a Sala correspondente
  async listarSolicitacoes() {
    return await prisma.solicitacaoEquipamento.findMany({
      include: {
        docente: {
          include: {
            usuario: { select: { nome: true, email: true } },
          },
        },
        reserva: {
          include: {
            sala: true, // Permite identificar a Sala de destino
          },
        },
        itens: {
          include: { equipamento: true },
        },
        administrador: {
          include: {
            usuario: { select: { nome: true, email: true } },
          },
        },
      },
      orderBy: { dt_solicitacao: 'desc' },
    });
  }

  // 3. Atualizar Status (Admin)
  async analisarSolicitacao(id_usuario_admin: number, id_solicitacao: number, status: string) {
    if (!id_usuario_admin || isNaN(id_usuario_admin)) {
      throw new AppError('Identificação de admin inválida ou ausente no token.', 401);
    }

    const statusValidos = ['APROVADO', 'RECUSADO'];
    const statusUpper = status ? status.toUpperCase().trim() : '';

    if (!statusValidos.includes(statusUpper)) {
      throw new AppError("O status deve ser 'APROVADO' ou 'RECUSADO'.", 400);
    }

    const admin = await prisma.administrador.findUnique({
      where: { id_usuario: Number(id_usuario_admin) },
    });

    if (!admin) {
      throw new AppError('Apenas administradores podem analisar solicitações.', 403);
    }

    const solicitacaoExiste = await prisma.solicitacaoEquipamento.findUnique({
      where: { id_solicitacao: Number(id_solicitacao) },
    });

    if (!solicitacaoExiste) {
      throw new AppError('Solicitação não encontrada.', 404);
    }

    return await prisma.solicitacaoEquipamento.update({
      where: { id_solicitacao: Number(id_solicitacao) },
      data: {
        status: statusUpper,
        id_admin_analise: admin.id_adm,
        dt_resposta: new Date(),
      },
      include: {
        reserva: { include: { sala: true } },
        itens: { include: { equipamento: true } },
      },
    });
  }
  // Adicionar dentro da classe SolicitacaoEquipamentoService:

  // Adicionar dentro da classe SolicitacaoEquipamentoService:

  async cancelarSolicitacao(id_usuario_docente: number, id_solicitacao: number) {
    if (!id_usuario_docente || isNaN(id_usuario_docente)) {
      throw new AppError('Identificação de utilizador inválida ou ausente no token.', 401);
    }

    if (!id_solicitacao || isNaN(id_solicitacao)) {
      throw new AppError('ID de solicitação inválido.', 400);
    }

    // 1. Busca o perfil de Docente do utilizador logado
    const docente = await prisma.docente.findUnique({
      where: { id_usuario: Number(id_usuario_docente) },
    });

    if (!docente) {
      throw new AppError('Apenas docentes podem apagar as suas próprias solicitações.', 403);
    }

    // 2. Busca a solicitação para verificar se existe e quem é o dono
    const solicitacao = await prisma.solicitacaoEquipamento.findUnique({
      where: { id_solicitacao: Number(id_solicitacao) },
    });

    if (!solicitacao) {
      throw new AppError('Solicitação de equipamento não encontrada.', 404);
    }

    // 3. Verifica se a solicitação pertence ao docente logado
    if (solicitacao.id_docente !== docente.id_docente) {
      throw new AppError('Não tem permissão para apagar esta solicitação.', 403);
    }

    // 4. Regra opcional: Impedir a eliminação se já tiver sido aprovada/recusada
    if (solicitacao.status !== 'PENDENTE') {
      throw new AppError(`Não é possível apagar uma solicitação que já foi ${solicitacao.status}.`, 400);
    }

    // 5. Apaga os itens associados e depois a solicitação em transação atômica
    return await prisma.$transaction(async (tx) => {
      // Apaga primeiro os itens vinculados na tabela ITEM_SOLICITACAO
      await tx.itemSolicitacao.deleteMany({
        where: { id_solicitacao: Number(id_solicitacao) },
      });

      // Apaga o registo principal na tabela SOLICITACAO_EQUIPAMENTO
      return await tx.solicitacaoEquipamento.delete({
        where: { id_solicitacao: Number(id_solicitacao) },
      });
    });
  }
}