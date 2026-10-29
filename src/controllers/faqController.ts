import { Request, Response } from 'express';
import { faqService } from '../services/faqService';
import { AppError } from '../errors/AppError';

export class FaqController {
  // POST /faqs
  async criar(req: Request, res: Response) {
    const { pergunta, resposta, categoria } = req.body;

    const faq = await faqService.criarFaq({
      pergunta,
      resposta,
      categoria,
    });

    return res.status(201).json({
      mensagem: 'FAQ criado com sucesso!',
      faq,
    });
  }

  // GET /faqs
  async listar(req: Request, res: Response) {
    const { categoria, busca } = req.query;

    const faqs = await faqService.listarFaqs({
      categoria: categoria ? String(categoria) : undefined,
      busca: busca ? String(busca) : undefined,
    });

    return res.status(200).json(faqs);
  }

  // GET /faqs/:id
  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('O parâmetro id informado na URL é inválido.', 400);
    }

    const faq = await faqService.buscarPorId(Number(id));

    return res.status(200).json(faq);
  }

  // PUT /faqs/:id
  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const { pergunta, resposta, categoria } = req.body;

    if (!id || isNaN(Number(id))) {
      throw new AppError('O parâmetro id informado na URL é inválido.', 400);
    }

    const faqAtualizado = await faqService.atualizarFaq(Number(id), {
      pergunta,
      resposta,
      categoria,
    });

    return res.status(200).json({
      mensagem: 'FAQ atualizado com sucesso!',
      faq: faqAtualizado,
    });
  }

  // DELETE /faqs/:id
  async deletar(req: Request, res: Response) {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('O parâmetro id informado na URL é inválido.', 400);
    }

    await faqService.deletarFaq(Number(id));

    return res.status(200).json({
      mensagem: 'FAQ removido com sucesso!',
    });
  }
}

export const faqController = new FaqController();