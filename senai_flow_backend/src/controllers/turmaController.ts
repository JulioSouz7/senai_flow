import { Request, Response } from 'express';
import { TurmaService } from '../services/turmaService';
import { AppError } from '../errors/AppError';

const turmaService = new TurmaService();

export class TurmaController {
  async listar(req: Request, res: Response) {
    const user = req as Request & { user_id?: number; user_perfil?: string };
    const idUsuarioDocente =
      user.user_perfil?.toUpperCase() === 'DOCENTE' ? Number(user.user_id) : undefined;
    const turmas = await turmaService.listar(idUsuarioDocente);
    return res.status(200).json(turmas);
  }

  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;
    const turma = await turmaService.buscarPorId(Number(id));
    return res.status(200).json(turma);
  }

  async criar(req: Request, res: Response) {
    const { nome, curso, carga_horaria_semanal, qtd_alunos } = req.body;

    if (!nome || !curso || !carga_horaria_semanal) {
      return res.status(400).json({
        message: 'Campos obrigatórios ausentes: nome, curso e carga_horaria_semanal.',
      });
    }

    const novaTurma = await turmaService.criar({
      nome,
      curso,
      carga_horaria_semanal: Number(carga_horaria_semanal),
      qtd_alunos: qtd_alunos ? Number(qtd_alunos) : 0,
    });

    return res.status(201).json({ message: 'Turma cadastrada com sucesso!', turma: novaTurma });
  }

async vincularDocente(req: Request, res: Response) {
    const { id_turma, id_docente } = req.body;

    if (!id_turma || !id_docente) {
      throw new AppError('Informe os IDs da turma e do docente.', 400);
    }

    const vinculo = await turmaService.vincularDocente(Number(id_turma), Number(id_docente));

    return res.status(201).json({
      message: 'Docente vinculado à turma com sucesso.',
      vinculo
    });
  }
  
 async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const { nome, curso, carga_horaria_semanal, qtd_alunos } = req.body;

    const turmaAtualizada = await turmaService.atualizar(Number(id), {
      nome,
      curso,
      carga_horaria_semanal: carga_horaria_semanal ? Number(carga_horaria_semanal) : undefined,
      qtd_alunos: qtd_alunos !== undefined ? Number(qtd_alunos) : undefined,
    });

    return res.status(200).json({
      message: 'Turma atualizada com sucesso.',
      turma: turmaAtualizada,
    });
  }

async deletar(req: Request, res: Response) {
    const { id } = req.params;
    const resultado = await turmaService.deletar(Number(id));
    return res.status(200).json(resultado);
  }
}