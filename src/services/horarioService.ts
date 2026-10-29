import prisma from '../config/prisma';

export class HorarioService {
  async criar(hora_inicio: string, hora_fim: string) {
    // Exemplo: cadastrando o bloco das 07:30 às 09:10
    return await prisma.horario.create({
      data: {
        hora_inicio,
        hora_fim
      }
    });
  }

  async listar() {
    return await prisma.horario.findMany();
  }
}