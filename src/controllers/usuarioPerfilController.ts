import { Request, Response } from 'express';
import { UsuarioPerfilService } from '../services/usuarioPerfilService';
import { AppError } from '../errors/AppError';
import jwt from 'jsonwebtoken';

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
    const { nome, email, senha, nif, turmas_ids } = req.body;

    const docente = await usuarioPerfilService.criarDocente({
      nome,
      email,
      senha,
      nif,
      turmas_ids,
    });

    return res.status(201).json(docente);
  }

  // 2. Adicionar Turma ao Docente
  async adicionarTurma(req: Request, res: Response) {
    const { id_docente } = req.params;
    const { id_turma } = req.body;

    const vinculo = await usuarioPerfilService.adicionarTurmaDocente(
      Number(id_docente),
      Number(id_turma)
    );

    return res.status(201).json(vinculo);
  }

  // 3. Remover Turma do Docente
  async removerTurma(req: Request, res: Response) {
    const { id_docente, id_turma } = req.params;

    const resultado = await usuarioPerfilService.removerTurmaDocente(
      Number(id_docente),
      Number(id_turma)
    );

    return res.status(200).json(resultado);
  }

  // Cadastrar Administrador
  async criarAdministrador(req: Request, res: Response) {
    const { nome, email, senha, nif } = req.body;

    // Validações no Controller com negações
    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      throw new AppError('O campo nome é obrigatório.', 400);
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new AppError('O campo e-mail é obrigatório.', 400);
    }

    if (!senha || typeof senha !== 'string' || !senha.trim()) {
      throw new AppError('O campo senha é obrigatório.', 400);
    }

    if (!nif || typeof nif !== 'string' || !nif.trim()) {
      throw new AppError('O campo NIF é obrigatório para cadastrar um administrador.', 400);
    }

    const administrador = await usuarioPerfilService.criarAdministrador({
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
      nif: nif.trim()
    });

    const secret = process.env.JWT_SECRET || 'secreto_senai_flow';
    const token = jwt.sign(
      {
        email: administrador.email,
        perfil: administrador.perfil || 'ADMINISTRADOR',
        id_docente: null,
        id_adm: administrador.id_adm,
        id_aluno: null,
      },
      secret,
      {
        subject: String(administrador.id_usuario),
        expiresIn: '8h',
      }
    )

    return res.status(201).json({
      message: 'Administrador criado com sucesso!',
      token,
      administrador
});
  }
}