import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class ComunicadoService {
  /**
   * Converte/valida o ID de usuário do JWT para o ID da tabela Administrador
   */
  private async obterIdAdminValido(id_admin_ou_usuario: number): Promise<number> {
    const adminDireto = await prisma.administrador.findUnique({
      where: { id_adm: id_admin_ou_usuario },
    });

    if (adminDireto) return adminDireto.id_adm;

    const adminPorUsuario = await prisma.administrador.findUnique({
      where: { id_usuario: id_admin_ou_usuario },
    });

    if (adminPorUsuario) return adminPorUsuario.id_adm;

    throw new AppError('Acesso negado. Usuário não possui perfil de Administrador.', 403);
  }

  // 1. Criar Comunicado (Apenas Administrador)
  async criar(dados: {
    id_admin_ou_usuario: number;
    id_turma?: number;
    titulo: string;
    conteudo: string;
    publico_alvo?: string;
  }) {
    if (!dados.titulo || !dados.titulo.trim()) {
      throw new AppError('O campo título é obrigatório.', 400);
    }

    if (!dados.conteudo || !dados.conteudo.trim()) {
      throw new AppError('O campo conteúdo é obrigatório.', 400);
    }

    const id_adm = await this.obterIdAdminValido(dados.id_admin_ou_usuario);
    const abrangencia = dados.id_turma ? 'TURMA' : 'GERAL';

    if (dados.id_turma) {
      const turmaExiste = await prisma.turma.findUnique({
        where: { id_turma: Number(dados.id_turma) },
      });
      if (!turmaExiste) {
        throw new AppError('A turma informada não existe no sistema.', 404);
      }
    }

    try {
      return await prisma.comunicado.create({
        data: {
          id_adm,
          id_turma: dados.id_turma ? Number(dados.id_turma) : null,
          titulo: dados.titulo.trim(),
          conteudo: dados.conteudo.trim(),
          abrangencia,
          publico_alvo: dados.publico_alvo || (dados.id_turma ? 'Turma específica' : 'Toda a instituição'),
          dt_publicacao: new Date(),
        },
        include: {
          administrador: { select: { usuario: { select: { nome: true } } } },
          turma: { select: { id_turma: true, nome: true, curso: true } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('Falha de associação de chave estrangeira.', 400);
      }
      throw error;
    }
  }

  // 2. Listar todos os comunicados GERAIS
  async listarGerais() {
    return await prisma.comunicado.findMany({
      where: { abrangencia: 'GERAL' },
      include: {
        administrador: { select: { usuario: { select: { nome: true } } } },
      },
      orderBy: { dt_publicacao: 'desc' },
    });
  }

  // 3. Sessão Minha Turma (Comunicados da turma + Comunicados gerais da instituição)
  // Sessão Minha Turma (Alunos e Docentes)
  async obterSessaoMinhaTurma(id_usuario: number) {
    // 1. Busca os dados do usuário com relacionamentos de Aluno e Docente
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario },
      select: {
        id_usuario: true,
        perfil: true,
        aluno: {
          select: {
            id_turma: true,
            turma: true,
          },
        },
        docente: {
          select: {
            id_docente: true,
            // Relação N:N direta via tabela DOCENTE_TURMA
            docente_turma: {
              select: {
                id_turma: true,
                turma: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    let idsTurmas: number[] = [];
    let dadosTurma: any = null;

    // Se for Aluno
    if (usuario.aluno?.id_turma) {
      idsTurmas.push(usuario.aluno.id_turma);
      dadosTurma = usuario.aluno.turma;
    } 
    // Se for Docente (mapeia todas as turmas vinculadas na DOCENTE_TURMA)
    else if (usuario.docente && usuario.docente.docente_turma.length > 0) {
      idsTurmas = usuario.docente.docente_turma.map((dt) => dt.id_turma);
      dadosTurma = usuario.docente.docente_turma.map((dt) => dt.turma);
    }

    if (idsTurmas.length === 0) {
      throw new AppError('O usuário logado não possui vínculo ativo com nenhuma turma.', 400);
    }

    // 2. Busca estritamente os comunicados das turmas associadas (abrangência TURMA)
    const comunicados = await prisma.comunicado.findMany({
      where: {
        id_turma: { in: idsTurmas },
        abrangencia: 'TURMA',
      },
      include: {
        administrador: {
          select: {
            usuario: { select: { nome: true } },
          },
        },
        turma: {
          select: { id_turma: true, nome: true, curso: true },
        },
        reserva: {
          include: {
            sala: { select: { id_sala: true, nome: true, foto: true } },
          },
        },
      },
      orderBy: { dt_publicacao: 'desc' },
    });

    return {
      turma: dadosTurma,
      comunicados,
    };
  }

  // 4. Deletar Comunicado (Apenas Administrador)
  async deletar(id_comunicado: number) {
    if (isNaN(id_comunicado)) throw new AppError('ID de comunicado inválido.', 400);

    const comunicado = await prisma.comunicado.findUnique({ where: { id_comunicado } });
    if (!comunicado) throw new AppError('Comunicado não encontrado.', 404);

    return await prisma.comunicado.delete({
      where: { id_comunicado },
      select: { id_comunicado: true, titulo: true },
    });
  }

  async buscarPorId(id_comunicado: number) {
    if (isNaN(id_comunicado)) {
      throw new AppError('ID do comunicado inválido.', 400);
    }

    const comunicado = await prisma.comunicado.findUnique({
      where: { id_comunicado },
      include: {
        administrador: {
          select: {
            usuario: { select: { nome: true } },
          },
        },
        turma: {
          select: { id_turma: true, nome: true, curso: true },
        },
        reserva: {
          include: {
            sala: { select: { id_sala: true, nome: true } },
          },
        },
      },
    });

    if (!comunicado) {
      throw new AppError('Comunicado não encontrado.', 404);
    }

    return comunicado;
  }
}

export const comunicadoService = new ComunicadoService();