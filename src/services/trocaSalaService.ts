import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class TrocaSalaService {
  async listar() {
    return await prisma.trocaSala.findMany({
      include: {
        reserva: true,
        sala_origem: { select: { id_sala: true, nome: true } },
        sala_destino: { select: { id_sala: true, nome: true } },
        docente_solicitante: {
          include: {
            usuario: { select: { id_usuario: true, nome: true, email: true } },
          },
        },
      },
      orderBy: { id_troca: 'desc' },
    });
  }

  async buscarPorId(id_troca: number) {
    if (isNaN(id_troca)) throw new AppError('ID de troca de sala inválido.', 400);

    const troca = await prisma.trocaSala.findUnique({
      where: { id_troca },
      include: {
        reserva: true,
        sala_origem: true,
        sala_destino: true,
        docente_solicitante: {
          include: { usuario: { select: { nome: true, email: true } } },
        },
      },
    });

    if (!troca) {
      throw new AppError('Solicitação de troca de sala não encontrada.', 404);
    }

    return troca;
  }

  async solicitar(dados: {
    id_reserva_origem: number;
    id_reserva_destino: number;
    id_docente_solicitante: number;
    motivo: string;
  }) {
    const { id_reserva_origem, id_reserva_destino, id_docente_solicitante, motivo } = dados;

    if (!id_reserva_origem || !id_reserva_destino || !id_docente_solicitante || !motivo) {
      throw new AppError('Reserva de origem, reserva de destino e motivo são obrigatórios.', 400);
    }

    // 1. Resolve o docente solicitante na tabela DOCENTE (via id_docente ou id_usuario do token)
    const docente = await prisma.docente.findFirst({
      where: {
        OR: [
          { id_docente: id_docente_solicitante },
          { id_usuario: id_docente_solicitante },
        ],
      },
    });

    if (!docente) throw new AppError('Docente solicitante não encontrado no sistema.', 404);

    const idDocenteEfetivo = docente.id_docente;

    // 2. Busca e valida a reserva de origem
    const reservaOrigem = await prisma.reserva.findUnique({
      where: { id_reserva: id_reserva_origem },
      include: {
        reserva_docente: true,
      },
    });

    if (!reservaOrigem) throw new AppError('Reserva de origem não encontrada.', 404);

    const ehDonoOrigem = reservaOrigem.reserva_docente.some(
      (rd) => rd.id_docente === idDocenteEfetivo
    );

    if (!ehDonoOrigem) {
      throw new AppError('Acesso negado: A reserva de origem não pertence ao docente autenticado.', 403);
    }

    // 3. Busca e valida a reserva de destino
    const reservaDestino = await prisma.reserva.findUnique({
      where: { id_reserva: id_reserva_destino },
      include: {
        reserva_docente: true,
      },
    });

    if (!reservaDestino) throw new AppError('Reserva de destino não encontrada.', 404);

    const ehDonoDestino = reservaDestino.reserva_docente.some(
      (rd) => rd.id_docente === idDocenteEfetivo
    );

    if (ehDonoDestino) {
      throw new AppError('Não é possível solicitar troca entre duas reservas do mesmo docente.', 400);
    }

    // 4. Previne duplicidade
    const trocaPendente = await prisma.trocaSala.findFirst({
      where: {
        id_reserva: id_reserva_origem,
        status: 'PENDENTE',
      },
    });

    if (trocaPendente) {
      throw new AppError('Já existe uma solicitação de troca pendente para esta reserva.', 409);
    }

    // 5. Cria o registo na tabela TROCA_SALA com os IDs das salas
    return await prisma.trocaSala.create({
      data: {
        id_reserva: id_reserva_origem,
        id_sala_origem: reservaOrigem.id_sala,
        id_sala_destino: reservaDestino.id_sala,
        id_docente_solicitante: idDocenteEfetivo,
        id_coordenador: null,
        status: 'PENDENTE',
        motivo: motivo.trim(),
        dt_troca: new Date(),
      },
      include: {
        reserva: true,
        sala_origem: true,
        sala_destino: true,
      },
    });
  }

  async responderEntreDocentes(id_troca: number, id_docente_destinatario: number, novoStatus: 'ACEITA' | 'RECUSADA') {
    if (isNaN(id_troca)) throw new AppError('ID de troca inválido.', 400);
    if (!['ACEITA', 'RECUSADA'].includes(novoStatus)) {
      throw new AppError('Status inválido. Utilize apenas "ACEITA" ou "RECUSADA".', 400);
    }

    // 1. Procura a solicitação de troca pelo ID
    const troca = await prisma.trocaSala.findUnique({
      where: { id_troca },
      include: {
        reserva: true,
      },
    });

    if (!troca) throw new AppError('Solicitação de troca de sala não encontrada.', 404);

    if (troca.status !== 'PENDENTE') {
      throw new AppError(`Esta solicitação de troca já foi finalizada com o status: ${troca.status}.`, 400);
    }

    // 2. Converte o ID vindo do token no id_docente real da tabela DOCENTE
    const docenteDestino = await prisma.docente.findFirst({
      where: {
        OR: [
          { id_docente: id_docente_destinatario },
          { id_usuario: id_docente_destinatario },
        ],
      },
    });

    if (!docenteDestino) throw new AppError('Docente destinatário não encontrado no sistema.', 404);

    const idDocenteDestinoEfetivo = docenteDestino.id_docente;

    // 3. Localiza qualquer reserva desse docente que esteja associada à sala de destino da troca
    const reservaDestino = await prisma.reserva.findFirst({
      where: {
        id_sala: troca.id_sala_destino,
        reserva_docente: {
          some: {
            id_docente: idDocenteDestinoEfetivo,
          },
        },
      },
    });

    if (!reservaDestino) {
      throw new AppError('Apenas o docente titular da sala de destino pode responder a esta solicitação.', 403);
    }

    // 4. Se ACEITA, permuta o id_sala nas duas reservas e atualiza a troca
    if (novoStatus === 'ACEITA') {
      return await prisma.$transaction(async (tx) => {
        await tx.reserva.update({
          where: { id_reserva: troca.id_reserva },
          data: { id_sala: troca.id_sala_destino },
        });

        await tx.reserva.update({
          where: { id_reserva: reservaDestino.id_reserva },
          data: { id_sala: troca.id_sala_origem },
        });

        return await tx.trocaSala.update({
          where: { id_troca },
          data: { status: 'ACEITA' },
          include: { reserva: true, sala_origem: true, sala_destino: true },
        });
      });
    }

    return await prisma.trocaSala.update({
      where: { id_troca },
      data: { status: 'RECUSADA' },
      include: { reserva: true, sala_origem: true, sala_destino: true },
    });
  }

  async cancelar(id_troca: number, id_docente_solicitante: number) {
  if (isNaN(id_troca)) throw new AppError('ID de troca de sala inválido.', 400);

  // 1. Busca a solicitação de troca
  const troca = await prisma.trocaSala.findUnique({
    where: { id_troca },
  });

  if (!troca) {
    throw new AppError('Solicitação de troca de sala não encontrada.', 404);
  }

  // 2. Regra de Negócio: Impede o cancelamento se já foi ACEITA
  if (troca.status === 'ACEITA') {
    throw new AppError('Não é possível cancelar uma solicitação de troca que já foi ACEITA.', 400);
  }

  // 3. Impede re-cancelar uma troca que já foi cancelada ou recusada
  if (troca.status === 'CANCELADA' || troca.status === 'RECUSADA') {
    throw new AppError(`Esta solicitação de troca já se encontra com o status: ${troca.status}.`, 400);
  }

  // 4. Resolve o id_docente real do usuário logado
  const docente = await prisma.docente.findFirst({
    where: {
      OR: [
        { id_docente: id_docente_solicitante },
        { id_usuario: id_docente_solicitante },
      ],
    },
  });

  if (!docente) throw new AppError('Docente solicitante não encontrado no sistema.', 404);

  // 5. Valida se o docente logado é realmente o criador da solicitação
  if (troca.id_docente_solicitante !== docente.id_docente) {
    throw new AppError('Apenas o docente solicitante pode cancelar esta solicitação.', 403);
  }

  // 6. Atualização de status (Soft Delete / Cancelamento Lógico)
  return await prisma.trocaSala.update({
    where: { id_troca },
    data: { status: 'CANCELADA' },
    include: {
      reserva: true,
      sala_origem: true,
      sala_destino: true,
    },
  });
}
}

export const trocaSalaService = new TrocaSalaService();