import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class EquipamentoSolicitacaoService {
  async solicitar(id_reserva: number, id_equipamento: number, id_usuario_docente: number, quantidade = 1) {
    const docente = await prisma.docente.findUnique({
      where: { id_usuario: id_usuario_docente },
    });

    if (!docente) {
      throw new AppError('Apenas docentes podem solicitar equipamentos.', 403);
    }

    return await prisma.$transaction(async (tx) => {
      const solicitacao = await tx.solicitacaoEquipamento.create({
        data: {
          id_reserva,
          id_docente: docente.id_docente,
          status: 'PENDENTE',
        },
      });

      await tx.itemSolicitacao.create({
        data: {
          id_solicitacao: solicitacao.id_solicitacao,
          id_equipamento,
          quantidade,
        },
      });

      return solicitacao;
    });
  }
}