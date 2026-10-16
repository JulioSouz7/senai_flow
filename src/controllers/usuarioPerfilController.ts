import { Request, Response } from 'express';
import { UsuarioPerfilService } from '../services/usuarioPerfilService';

const usuarioPerfilService = new UsuarioPerfilService();

export class UsuarioPerfilController {
  async criarAluno(req: Request, res: Response) {
    try {
      const { nome, email, senha, matricula, id_turma } = req.body;

      const aluno = await usuarioPerfilService.criarAluno({
        nome,
        email,
        senha,
        matricula,
        id_turma: Number(id_turma),
      });

      return res.status(201).json({
        message: 'Aluno cadastrado com sucesso!',
        aluno,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        error: true,
        message: error.message || 'Erro ao cadastrar aluno.',
      });
    }
  }

  async atualizarSituacaoAluno(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { situacao } = req.body;

      const alunoAtualizado = await usuarioPerfilService.atualizarSituacaoAluno(Number(id), situacao);

      return res.status(200).json({
        message: 'Situação do aluno atualizada com sucesso!',
        aluno: alunoAtualizado,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        error: true,
        message: error.message || 'Erro ao atualizar situação do aluno.',
      });
    }
  }

  async criarDocente(req: Request, res: Response) {
    try {
      const { nome, email, senha, nif } = req.body;

      const docente = await usuarioPerfilService.criarDocente({
        nome,
        email,
        senha,
        nif,
      });

      return res.status(201).json({
        message: 'Docente cadastrado com sucesso!',
        docente,
      });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        error: true,
        message: error.message || 'Erro ao cadastrar docente.',
      });
    }
  }
}