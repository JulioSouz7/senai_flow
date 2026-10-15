import { Request, Response } from 'express';
import { ComunicadoService } from '../services/comunicadoService';

const comunicadoService = new ComunicadoService();

export class ComunicadoController {
  async listar(req: Request, res: Response) {
    try {
      const comunicados = await comunicadoService.listar();
      return res.status(200).json(comunicados);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const comunicado = await comunicadoService.buscarPorId(Number(id));
      return res.status(200).json(comunicado);
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async criar(req: Request, res: Response) {
    try {
      const { id_turma, id_reserva, titulo, conteudo, abrangencia, publico_alvo } = req.body;
      const id_adm = (req as any).user?.id || req.body.id_adm;

      if (!id_adm || !titulo || !conteudo) {
        return res.status(400).json({ message: 'Os campos id_adm, titulo e conteudo são obrigatórios.' });
      }

      const novoComunicado = await comunicadoService.criar({
        id_adm: Number(id_adm),
        id_turma: id_turma ? Number(id_turma) : undefined,
        id_reserva: id_reserva ? Number(id_reserva) : undefined,
        titulo,
        conteudo,
        abrangencia,
        publico_alvo,
      });

      return res.status(201).json({
        message: 'Comunicado publicado com sucesso!',
        comunicado: novoComunicado,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }

  async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultado = await comunicadoService.deletar(Number(id));

      return res.status(200).json({
        message: 'Comunicado removido com sucesso!',
        comunicado: resultado,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({ message: error.message });
    }
  }
}