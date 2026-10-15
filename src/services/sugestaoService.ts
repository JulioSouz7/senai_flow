import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class SugestaoService {
  async listar() {
    return await prisma.relatoSugestao.findMany({
      include: {
        usuario: { select: { id_usuario: true, nome: true, email: true } },
      },
      orderBy: { id_relato: 'desc' },
    });
  }

  async buscarPorId(id_relato: number) {
    if (isNaN(id_relato)) throw new AppError('ID de relato inválido.', 400);

    const relato = await prisma.relatoSugestao.findUnique({
      where: { id_relato },
      include: {
        usuario: { select: { id_usuario: true, nome: true, email: true } },
      },
    });

    if (!relato) {
      throw new AppError('Relato/Sugestão não encontrado.', 404);
    }

    return relato;
  }

  async criar(dados: {
    id_usuario: number;
    tipo: 'SUGESTAO' | 'RECLAMACAO' | string;
    descricao: string;
    encaminhada_corporativo?: boolean;
  }) {
    if (!dados.id_usuario || !dados.descricao) {
      throw new AppError('Usuário e descrição são obrigatórios.', 400);
    }

    const usuario = await prisma.usuario.findUnique({ where: { id_usuario: dados.id_usuario } });
    if (!usuario) throw new AppError('Usuário autor do relato não encontrado.', 404);

    const dtEnvio = new Date();
    const prazoResposta = new Date(dtEnvio);
    prazoResposta.setDate(prazoResposta.getDate() + 5);

    try {
      return await prisma.relatoSugestao.create({
        data: {
          id_usuario: dados.id_usuario,
          tipo: dados.tipo || 'SUGESTAO',
          descricao: dados.descricao,
          dt_envio: dtEnvio,
          prazo_resposta: prazoResposta,
          status: 'PENDENTE',
          id_admin: null as any,
          resposta: null as any,
          encaminhada_corporativo: dados.encaminhada_corporativo ?? false,
        },
        include: {
          usuario: { select: { id_usuario: true, nome: true, email: true } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('Erro de chave estrangeira ao registrar relato/sugestão.', 400);
      }
      throw error;
    }
  }

  async responder(id_relato: number, resposta: string, status: string, id_admin: number) {
    if (isNaN(id_relato)) throw new AppError('ID de relato inválido.', 400);

    const relato = await prisma.relatoSugestao.findUnique({ where: { id_relato } });
    if (!relato) throw new AppError('Relato/Sugestão não encontrado.', 404);

    return await prisma.relatoSugestao.update({
      where: { id_relato },
      data: {
        resposta,
        status: status || 'ARQUIVADO',
        id_admin,
      },
      include: {
        usuario: { select: { id_usuario: true, nome: true, email: true } },
      },
    });
  }
}