// import prisma from '../config/prisma';
// import { Prisma } from '@prisma/client';
// import { AppError } from '../errors/AppError';

// export class PontuacaoService {
//   // RF05 / RN15: Registrar pontuação vinculada à reserva e turma
//   async registrar(dados: {
//     id_reserva: number;
//     id_turma: number;
//     pontos: number;
//     semestre_letivo: string;
//   }) {
//     if (!dados.id_reserva || !dados.id_turma || dados.pontos === undefined || !dados.semestre_letivo) {
//       throw new AppError('Reserva, turma, pontos e semestre letivo são obrigatórios.', 400);
//     }

//     const [reserva, turma] = await Promise.all([
//       prisma.reserva.findUnique({ where: { id_reserva: dados.id_reserva } }),
//       prisma.turma.findUnique({ where: { id_turma: dados.id_turma } }),
//     ]);

//     if (!reserva) throw new AppError('Reserva não encontrada.', 404);
//     if (!turma) throw new AppError('Turma não encontrada.', 404);

//     try {
//       return await prisma.pontuacao.create({
//         data: {
//           id_reserva: dados.id_reserva,
//           id_turma: dados.id_turma,
//           pontos: dados.pontos,
//           semestre_letivo: dados.semestre_letivo,
//         },
//         include: {
//           turma: { select: { id_turma: true, nome: true, curso: true } },
//           reserva: { select: { id_reserva: true, dt_reserva: true } },
//         },
//       });
//     } catch (error) {
//       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
//         throw new AppError('Erro de chave estrangeira ao registrar pontuação.', 400);
//       }
//       throw error;
//     }
//   }

//   // Obter ranking consolidado por turma no semestre letivo vigente
//   async obterRanking(semestre_letivo?: string) {
//     const semestre = semestre_letivo || '2026-2';

//     return await prisma.pontuacao.groupBy({
//       by: ['id_turma'],
//       where: { semestre_letivo: semestre },
//       _sum: { pontos: true },
//       orderBy: { _sum: { pontos: 'desc' } },
//     });
//   }

//   // Listar histórico de pontuações por turma
//   async listarPorTurma(id_turma: number) {
//     if (isNaN(id_turma)) throw new AppError('ID de turma inválido.', 400);

//     return await prisma.pontuacao.findMany({
//       where: { id_turma },
//       include: {
//         reserva: { select: { id_reserva: true, dt_reserva: true } },
//       },
//       orderBy: { id_pontuacao: 'desc' },
//     });
//   }

//   // RN15: Reset semestral de pontuação
//   async resetSemestral(semestre_letivo: string) {
//     if (!semestre_letivo) throw new AppError('Informe o semestre letivo para o reset.', 400);

//     const resultado = await prisma.pontuacao.deleteMany({
//       where: { semestre_letivo },
//     });

//     return {
//       message: `Pontuações do semestre ${semestre_letivo} resetadas com sucesso.`,
//       registros_removidos: resultado.count,
//     };
//   }
// }