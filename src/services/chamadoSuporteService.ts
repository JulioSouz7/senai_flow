import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export interface ICriarChamadoInput {
  id_usuario: number;
  assunto: string;
  descricao: string;
}

export interface IAtualizarStatusChamadoInput {
  id_chamado: number;
  id_usuario_admin: number; // ID do usuario vindo do token
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'RESOLVIDO';
}

const STATUS_PERMITIDOS = ['ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO'];

export class ChamadoSuporteService {
  // Criar um novo chamado de suporte (Docentes / Alunos / Usuários)
  async criarChamado(dados: ICriarChamadoInput) {
    const { id_usuario, assunto, descricao } = dados;

    // Negações e Validações de Entrada
    if (!id_usuario || isNaN(id_usuario)) {
      throw new AppError('Usuário não autenticado ou inválido.', 401);
    }

    if (!assunto || typeof assunto !== 'string' || !assunto.trim()) {
      throw new AppError('O assunto do chamado é obrigatório.', 400);
    }

    if (!descricao || typeof descricao !== 'string' || !descricao.trim()) {
      throw new AppError('A descrição do chamado é obrigatória.', 400);
    }

    if (descricao.trim().length < 30) {
      throw new AppError('A descrição do chamado deve conter no mínimo 30 caracteres.', 400);
    }

    // Verifica se o usuário solicitante existe
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { id_usuario },
    });

    if (!usuarioExiste) {
      throw new AppError('Usuário solicitante não encontrado no sistema.', 404);
    }

    const novoChamado = await prisma.chamadoSuporte.create({
      data: {
        id_usuario,
        assunto: assunto.trim(),
        descricao: descricao.trim(),
        status: 'ABERTO',
      },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            nome: true,
            email: true,
            perfil: true,
          },
        },
      },
    });

    return novoChamado;
  }

  // Atualizar o status do chamado e Vincular o Administrador responsável
  async atualizarStatus(dados: IAtualizarStatusChamadoInput) {
    const { id_chamado, id_usuario_admin, status } = dados;

    if (!id_chamado || isNaN(id_chamado) || id_chamado <= 0) {
      throw new AppError('O ID do chamado informado na URL é inválido.', 400);
    }

    if (!status || !STATUS_PERMITIDOS.includes(status)) {
      throw new AppError(
        `Status inválido. Os status permitidos são: ${STATUS_PERMITIDOS.join(', ')}.`,
        400
      );
    }

    // Busca a reserva/chamado existente
    const chamadoExistente = await prisma.chamadoSuporte.findUnique({
      where: { id_chamado },
    });

    if (!chamadoExistente) {
      throw new AppError('Chamado de suporte não encontrado.', 404);
    }

    // Busca o registro de Administrador vinculado a este usuário do token
    const admin = await prisma.administrador.findUnique({
      where: { id_usuario: id_usuario_admin },
    });

    if (!admin) {
      throw new AppError('Apenas administradores cadastrados podem alterar o status de chamados.', 403);
    }

    // Atualiza status e vincula o id_adm correspondente ao token
    const chamadoAtualizado = await prisma.chamadoSuporte.update({
      where: { id_chamado },
      data: {
        status,
        id_admin_resp: admin.id_adm,
      },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            nome: true,
            email: true,
          },
        },
        admin_resp: {
          select: {
            id_adm: true,
            usuario: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return chamadoAtualizado;
  }

  // Listar chamados (Com filtro opcional por status ou perfil)
  async listarChamados(status?: string, id_usuario?: number) {
    const whereCondition: any = {};

    if (status) {
      if (!STATUS_PERMITIDOS.includes(status)) {
        throw new AppError(`Filtro de status inválido. Use: ${STATUS_PERMITIDOS.join(', ')}.`, 400);
      }
      whereCondition.status = status;
    }

    if (id_usuario) {
      whereCondition.id_usuario = id_usuario;
    }

    const chamados = await prisma.chamadoSuporte.findMany({
      where: whereCondition,
      include: {
        usuario: {
          select: {
            id_usuario: true,
            nome: true,
            email: true,
            perfil: true,
          },
        },
        admin_resp: {
          select: {
            id_adm: true,
            usuario: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        dt_abertura: 'desc',
      },
    });

    return chamados;
  }

  // Obter detalhes de um chamado por ID
  async buscarPorId(id_chamado: number) {
    if (!id_chamado || isNaN(id_chamado) || id_chamado <= 0) {
      throw new AppError('O ID do chamado informado é inválido.', 400);
    }

    const chamado = await prisma.chamadoSuporte.findUnique({
      where: { id_chamado },
      include: {
        usuario: {
          select: {
            id_usuario: true,
            nome: true,
            email: true,
            perfil: true,
          },
        },
        admin_resp: {
          select: {
            id_adm: true,
            usuario: {
              select: {
                nome: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!chamado) {
      throw new AppError('Chamado de suporte não encontrado.', 404);
    }

    return chamado;
  }
}

export const chamadoSuporteService = new ChamadoSuporteService();