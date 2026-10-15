import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export class ReservaAvancadaService {
  async encerrarReserva(id_reserva: number, sala_em_ordem: boolean, observacoes?: string) {
    return await prisma.reserva.update({
      where: { id_reserva },
      data: {
        status: 'ENCERRADA',
        dt_encerramento: new Date(),
        sala_em_ordem,
        obs_encerramento: observacoes,
      },
    });
  }
}