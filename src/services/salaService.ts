import prisma from '../config/prisma';

export class SalaService {
  async listarTodas() {
    return await prisma.sala.findMany({
      include: {
        predio: true,
        sala_equipamento: {
          include: { equipamento: true },
        },
      },
    });
  }

  async criar(data: { id_predio: number; nome: string; capacidade: number; qr_code: string }) {
    return await prisma.sala.create({
      data: {
        id_predio: data.id_predio,
        nome: data.nome,
        capacidade: data.capacidade,
        qr_code: data.qr_code,
      },
    });
  }
}