import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';
import { Prisma } from '@prisma/client';

export class TurmaService {
    async listar() {
        return await prisma.turma.findMany({
            include: {
                alunos: {
                    select: {
                        id_aluno: true,
                        matricula: true,
                        usuario: { select: { nome: true, email: true } },
                    },
                },
                docente_turma: {
                    include: {
                        docente: {
                            include: { usuario: { select: { nome: true, email: true } } },
                        },
                    },
                },
            },
            orderBy: { nome: 'asc' },
        });
    }

    async buscarPorId(id_turma: number) {
        const turma = await prisma.turma.findUnique({
            where: { id_turma },
            include: {
                alunos: {
                    include: { usuario: { select: { nome: true, email: true } } },
                },
                docente_turma: {
                    include: {
                        docente: {
                            include: { usuario: { select: { nome: true, email: true } } },
                        },
                    },
                },
                reservas: true,
            },
        });

        if (!turma) {
            throw new AppError('Turma não encontrada', 404);
        }

        return turma;
    }

    async criar(dados: { nome: string; curso: string; carga_horaria_semanal: number; qtd_alunos?: number }) {
        return await prisma.turma.create({
            data: {
                nome: dados.nome,
                curso: dados.curso,
                carga_horaria_semanal: dados.carga_horaria_semanal,
                qtd_alunos: dados.qtd_alunos || 0,
            },
        });
    }

async vincularDocente(id_turma: number, id_docente: number) {

  const vinculoDuplicado = await prisma.docenteTurma.findFirst({
    where: { 
      id_turma: id_turma, 
      id_docente: id_docente 
    }
  });

  if (vinculoDuplicado) {
  
    throw { statusCode: 400, message: 'Este docente já está vinculado a esta turma.' };
  }

  const docenteOcupado = await prisma.docenteTurma.findFirst({
    where: { 
      id_docente: id_docente 
    }
  });

  if (docenteOcupado) {
    throw { statusCode: 400, message: 'Este docente já está vinculado a outra turma.' };
  }


  const turmaCheia = await prisma.docenteTurma.findFirst({
    where: { 
      id_turma: id_turma 
    }
  });

  if (turmaCheia) {
    throw { statusCode: 400, message: 'Esta turma já possui um docente responsável.' };
  }

  const novoVinculo = await prisma.docenteTurma.create({
    data: {
      id_turma,
      id_docente
    }
  });

  return novoVinculo;
}


    async atualizar(id_turma: number, dados: { nome?: string; curso?: string; carga_horaria_semanal?: number; qtd_alunos?: number }) {
    if (isNaN(id_turma)) {
      throw new AppError('ID de turma inválido.', 400);
    }

    const turma = await prisma.turma.findUnique({
      where: { id_turma },
    });

    if (!turma) {
      throw new AppError('Turma não encontrada', 404);
    }

    return await prisma.turma.update({
      where: { id_turma },
      data: {
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.curso && { curso: dados.curso }),
        ...(dados.carga_horaria_semanal !== undefined && { carga_horaria_semanal: dados.carga_horaria_semanal }),
        ...(dados.qtd_alunos !== undefined && { qtd_alunos: dados.qtd_alunos }),
      },
    });
  }

    async deletar(id_turma: number) {
    if (isNaN(id_turma)) {
      throw new AppError('ID de turma inválido.', 400);
    }

    const turma = await prisma.turma.findUnique({
      where: { id_turma },
    });

    if (!turma) {
      throw new AppError('Turma não encontrada', 404);
    }

    try {
      // Transação para remover vínculos pivô de docentes e excluir a turma com segurança
      await prisma.$transaction(async (tx) => {
        // 1. Remove os vínculos na tabela DocenteTurma
        await tx.docenteTurma.deleteMany({
          where: { id_turma },
        });

        // 2. Apaga a turma
        await tx.turma.delete({
          where: { id_turma },
        });
      });

      return { message: 'Turma excluída com sucesso!' };
    } catch (error: any) {
      // Trata restrição para Alunos ou Reservas vinculadas que impedem a exclusão
      if (
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') ||
        (error.message && error.message.includes('foreign key constraint'))
      ) {
        throw new AppError(
          'Não é possível excluir esta turma pois existem alunos ou reservas vinculadas a ela.',
          400
        );
      }
      throw error;
    }
  }
}
