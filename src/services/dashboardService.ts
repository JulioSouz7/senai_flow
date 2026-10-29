import prisma from '../config/prisma';

export class DashboardService {
  async obterResumo() {
    const [
      totalReservas,
      reservasAtivas,
      totalAvarias,
      avariasEmAnalise,
      totalComunicados,
      trocasPendentes,
      ultimasAvarias,
    ] = await Promise.all([
      prisma.reserva.count(),
      prisma.reserva.count({ where: { status: 'CONFIRMADA' } }),
      prisma.avaria.count(),
      prisma.avaria.count({ where: { status: 'EM_ANALISE' } }),
      prisma.comunicado.count(),
      prisma.trocaSala.count({ where: { status: 'PENDENTE' } }),
      prisma.avaria.findMany({
        take: 5,
        orderBy: { id_avaria: 'desc' },
        include: {
          sala: { select: { nome: true } },
          equipamento: { select: { nome: true } },
        },
      }),
    ]);

    return {
      estatisticas: {
        reservas: {
          total: totalReservas,
          ativas: reservasAtivas,
        },
        avarias: {
          total: totalAvarias,
          em_analise: avariasEmAnalise,
        },
        comunicados: {
          total: totalComunicados,
        },
        trocas_sala: {
          pendentes: trocasPendentes,
        },
      },
      ultimas_avarias: ultimasAvarias,
    };
  }
}