import prisma from '../config/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError';

export class AreaRiscoService {
  // 1. Cadastrar Área de Risco (Apenas Administrador)
  async criarAreaRisco(dados: {
    id_predio: number;
    id_adm: number;
    nome: string;
    tipo: string;
    orientacao_seguranca: string;
    andar: number;
    imagem_url?: string;
  }) {
    if (!dados.id_predio || isNaN(dados.id_predio)) {
      throw new AppError('O ID do prédio é obrigatório e deve ser numérico.', 400);
    }
    if (!dados.id_adm || isNaN(dados.id_adm)) {
      throw new AppError('O ID do administrador é obrigatório e deve ser numérico.', 400);
    }
    if (!dados.nome || typeof dados.nome !== 'string' || !dados.nome.trim()) {
      throw new AppError('O nome da área de risco é obrigatório.', 400);
    }
    if (!dados.tipo || typeof dados.tipo !== 'string' || !dados.tipo.trim()) {
      throw new AppError('O tipo da área de risco é obrigatório.', 400);
    }
    if (!dados.orientacao_seguranca || typeof dados.orientacao_seguranca !== 'string' || !dados.orientacao_seguranca.trim()) {
      throw new AppError('A orientação de segurança é obrigatória.', 400);
    }
    if (dados.andar === undefined || dados.andar === null || isNaN(dados.andar)) {
      throw new AppError('O andar é obrigatório e deve ser numérico.', 400);
    }

    const predioExiste = await prisma.predio.findUnique({
      where: { id_predio: dados.id_predio },
    });
    if (!predioExiste) {
      throw new AppError(`O prédio com ID ${dados.id_predio} não existe no banco de dados.`, 404);
    }

    const admExiste = await prisma.administrador.findUnique({
      where: { id_adm: dados.id_adm },
    });
    if (!admExiste) {
      throw new AppError(`O administrador com ID ${dados.id_adm} não foi encontrado.`, 404);
    }

    return await prisma.areaRisco.create({
      data: {
        id_predio: dados.id_predio,
        id_adm: dados.id_adm,
        nome: dados.nome.trim(),
        tipo: dados.tipo.trim().toUpperCase(),
        orientacao_seguranca: dados.orientacao_seguranca.trim(),
        andar: dados.andar,
        imagem_url: dados.imagem_url || null,
        status: 'ATIVO',
      },
      include: {
        predio: { select: { id_predio: true, nome: true } },
      },
    });
  }

  // 2. Listar Áreas de Risco com Filtros (Para Alunos, Docentes e Admins)
  async listarAreasRisco(filtros: {
    id_predio?: number;
    andar?: number;
    tipo?: string;
  }) {
    const where: Prisma.AreaRiscoWhereInput = {
      status: 'ATIVO',
    };

    if (filtros.id_predio && !isNaN(filtros.id_predio)) {
      where.id_predio = filtros.id_predio;
    }
    if (filtros.andar !== undefined && !isNaN(filtros.andar)) {
      where.andar = filtros.andar;
    }
    if (filtros.tipo && typeof filtros.tipo === 'string' && filtros.tipo.trim()) {
      where.tipo = { contains: filtros.tipo.trim(), mode: 'insensitive' };
    }

    return await prisma.areaRisco.findMany({
      where,
      include: {
        predio: { select: { id_predio: true, nome: true } },
        administrador: {
          select: {
            id_adm: true,
            usuario: { select: { nome: true, email: true } },
          },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  // 3. Buscar Área de Risco por ID
  async buscarPorId(id_area: number) {
    if (!id_area || isNaN(id_area)) {
      throw new AppError('O ID da área de risco é obrigatório e deve ser numérico.', 400);
    }

    const area = await prisma.areaRisco.findUnique({
      where: { id_area },
      include: {
        predio: { select: { id_predio: true, nome: true } },
        administrador: {
          select: {
            id_adm: true,
            usuario: { select: { nome: true, email: true } },
          },
        },
      },
    });

    if (!area) {
      throw new AppError(`Área de risco com ID ${id_area} não foi encontrada.`, 404);
    }

    return area;
  }

  // 4. Atualizar Área de Risco (Apenas Administrador)
  async atualizarAreaRisco(
    id_area: number,
    dados: {
      id_predio?: number;
      nome?: string;
      tipo?: string;
      orientacao_seguranca?: string;
      andar?: number;
      imagem_url?: string;
    }
  ) {
    if (!id_area || isNaN(id_area)) {
      throw new AppError('O ID da área de risco é obrigatório e deve ser numérico.', 400);
    }

    const areaExiste = await prisma.areaRisco.findUnique({ where: { id_area } });
    if (!areaExiste) {
      throw new AppError(`Área de risco com ID ${id_area} não foi encontrada.`, 404);
    }

    const dataToUpdate: Prisma.AreaRiscoUpdateInput = {};

    if (dados.id_predio) {
      const predioExiste = await prisma.predio.findUnique({ where: { id_predio: dados.id_predio } });
      if (!predioExiste) {
        throw new AppError(`Prédio com ID ${dados.id_predio} não existe.`, 404);
      }
      dataToUpdate.predio = { connect: { id_predio: dados.id_predio } };
    }

    if (dados.nome && typeof dados.nome === 'string' && dados.nome.trim()) {
      dataToUpdate.nome = dados.nome.trim();
    }
    if (dados.tipo && typeof dados.tipo === 'string' && dados.tipo.trim()) {
      dataToUpdate.tipo = dados.tipo.trim().toUpperCase();
    }
    if (dados.orientacao_seguranca && typeof dados.orientacao_seguranca === 'string' && dados.orientacao_seguranca.trim()) {
      dataToUpdate.orientacao_seguranca = dados.orientacao_seguranca.trim();
    }
    if (dados.andar !== undefined && !isNaN(dados.andar)) {
      dataToUpdate.andar = dados.andar;
    }
    if (dados.imagem_url) {
      dataToUpdate.imagem_url = dados.imagem_url;
    }

    return await prisma.areaRisco.update({
      where: { id_area },
      data: dataToUpdate,
      include: {
        predio: { select: { id_predio: true, nome: true } },
      },
    });
  }

  // 5. Exclusão Lógica / Desativar Área de Risco (Apenas Administrador)
  async desativarAreaRisco(id_area: number) {
    if (!id_area || isNaN(id_area)) {
      throw new AppError('O ID da área de risco é obrigatório e deve ser numérico.', 400);
    }

    const areaExiste = await prisma.areaRisco.findUnique({ where: { id_area } });
    if (!areaExiste) {
      throw new AppError(`Área de risco com ID ${id_area} não foi encontrada.`, 404);
    }

    return await prisma.areaRisco.update({
      where: { id_area },
      data: { status: 'INATIVO' },
    });
  }
}