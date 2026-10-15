import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class SolicitacaoEquipamentoService {
  async listar() {
    return await prisma.solicitacaoEquipamento.findMany({
      include: {
        docente: { include: { usuario: { select: { nome: true, email: true } } } },
        itens: { include: { equipamento: true } },
      },
      orderBy: { id_solicitacao: 'desc' },
    });
  }

  async criar(dados: {
    id_docente: number;
    id_reserva: number;
    observacao?: string;
    itens: { id_equipamento: number; quantidade: number }[];
  }) {
    if (!dados.id_docente || !dados.id_reserva || !dados.itens || dados.itens.length === 0) {
      throw new AppError('Docente, reserva e ao menos 1 item são obrigatórios.', 400);
    }

    return await prisma.solicitacaoEquipamento.create({
      data: {
        id_docente: dados.id_docente,
        id_reserva: dados.id_reserva,
        observacao: dados.observacao || '',
        status: 'PENDENTE',
        dt_solicitacao: new Date(),
        itens: {
          create: dados.itens.map((item) => ({
            id_equipamento: item.id_equipamento,
            quantidade: item.quantidade,
          })),
        },
      },
      include: {
        itens: { include: { equipamento: true } },
      },
    });
  }

  async responder(id_solicitacao: number, status: 'APROVADO' | 'RECUSADO', id_coordenador: number) {
    const solicitacao = await prisma.solicitacaoEquipamento.findUnique({ where: { id_solicitacao } });
    if (!solicitacao) throw new AppError('Solicitação não encontrada.', 404);

    return await prisma.solicitacaoEquipamento.update({
      where: { id_solicitacao },
      data: { status, id_coordenador },
      include: { itens: true },
    });
  }
}