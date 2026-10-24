import prisma from '../config/prisma';
import { AppError } from '../errors/AppError';

export interface ICriarFaqInput {
  pergunta: string;
  resposta: string;
  categoria?: string;
}

export interface IAtualizarFaqInput {
  pergunta?: string;
  resposta?: string;
  categoria?: string;
}

export interface IFiltroFaqInput {
  categoria?: string;
  busca?: string;
}

export class FaqService {
  // Criar FAQ
  async criarFaq(dados: ICriarFaqInput) {
    const { pergunta, resposta, categoria } = dados;

    // Validações de Negação
    if (!pergunta || typeof pergunta !== 'string' || !pergunta.trim()) {
      throw new AppError('O campo pergunta é obrigatório.', 400);
    }

    if (!resposta || typeof resposta !== 'string' || !resposta.trim()) {
      throw new AppError('O campo resposta é obrigatório.', 400);
    }

    // Verifica duplicidade de pergunta
    const faqExistente = await prisma.faq.findFirst({
      where: {
        pergunta: {
          equals: pergunta.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (faqExistente) {
      throw new AppError('Já existe uma pergunta cadastrada com este mesmo texto.', 400);
    }

    const faq = await prisma.faq.create({
      data: {
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
        categoria: categoria ? categoria.trim() : null,
      },
    });

    return faq;
  }

  // Listar FAQs com filtros opcionais
  async listarFaqs(filtros?: IFiltroFaqInput) {
    const whereCondition: any = {};

    if (filtros?.categoria) {
      whereCondition.categoria = {
        equals: filtros.categoria.trim(),
        mode: 'insensitive',
      };
    }

    if (filtros?.busca) {
      whereCondition.OR = [
        { pergunta: { contains: filtros.busca.trim(), mode: 'insensitive' } },
        { resposta: { contains: filtros.busca.trim(), mode: 'insensitive' } },
      ];
    }

    const faqs = await prisma.faq.findMany({
      where: whereCondition,
      orderBy: {
        id_faq: 'asc',
      },
    });

    return faqs;
  }

  // Buscar FAQ por ID
  async buscarPorId(id_faq: number) {
    if (!id_faq || isNaN(id_faq) || id_faq <= 0) {
      throw new AppError('O ID do FAQ informado é inválido.', 400);
    }

    const faq = await prisma.faq.findUnique({
      where: { id_faq },
    });

    if (!faq) {
      throw new AppError('FAQ não encontrado.', 404);
    }

    return faq;
  }

  // Atualizar FAQ
  async atualizarFaq(id_faq: number, dados: IAtualizarFaqInput) {
    if (!id_faq || isNaN(id_faq) || id_faq <= 0) {
      throw new AppError('O ID do FAQ informado é inválido.', 400);
    }

    const faqExistente = await prisma.faq.findUnique({
      where: { id_faq },
    });

    if (!faqExistente) {
      throw new AppError('FAQ não encontrado.', 404);
    }

    const { pergunta, resposta, categoria } = dados;

    // Validações de Negação caso os campos sejam enviados
    if (pergunta !== undefined && (!pergunta || !pergunta.trim())) {
      throw new AppError('O campo pergunta não pode ser vazio.', 400);
    }

    if (resposta !== undefined && (!resposta || !resposta.trim())) {
      throw new AppError('O campo resposta não pode ser vazio.', 400);
    }

    // Se a pergunta for alterada, verifica se não está duplicando outra pergunta existente
    if (pergunta && pergunta.trim().toLowerCase() !== faqExistente.pergunta.toLowerCase()) {
      const perguntaDuplicada = await prisma.faq.findFirst({
        where: {
          pergunta: {
            equals: pergunta.trim(),
            mode: 'insensitive',
          },
          NOT: {
            id_faq,
          },
        },
      });

      if (perguntaDuplicada) {
        throw new AppError('Já existe outra FAQ cadastrada com esta mesma pergunta.', 400);
      }
    }

    const faqAtualizado = await prisma.faq.update({
      where: { id_faq },
      data: {
        pergunta: pergunta ? pergunta.trim() : undefined,
        resposta: resposta ? resposta.trim() : undefined,
        categoria: categoria !== undefined ? (categoria ? categoria.trim() : null) : undefined,
      },
    });

    return faqAtualizado;
  }

  // Deletar FAQ (opcional para manutenção)
  async deletarFaq(id_faq: number) {
    if (!id_faq || isNaN(id_faq) || id_faq <= 0) {
      throw new AppError('O ID do FAQ informado é inválido.', 400);
    }

    const faqExistente = await prisma.faq.findUnique({
      where: { id_faq },
    });

    if (!faqExistente) {
      throw new AppError('FAQ não encontrado.', 404);
    }

    await prisma.faq.delete({
      where: { id_faq },
    });
  }
}

export const faqService = new FaqService();