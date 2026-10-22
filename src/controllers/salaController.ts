import { Request, Response } from 'express';
import { salaService } from '../services/salaService';
import { AppError } from '../errors/AppError';

export class SalaController {
  // Criar Sala
  async criar(req: Request, res: Response) {
    const { id_predio, nome, capacidade, qr_code, horarios } = req.body;

    if (!id_predio || isNaN(Number(id_predio))) {
      throw new AppError('O campo id_predio é obrigatório e deve ser numérico.', 400);
    }
    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      throw new AppError('O campo nome é obrigatório.', 400);
    }
    if (!capacidade || isNaN(Number(capacidade)) || Number(capacidade) <= 0) {
      throw new AppError('O campo capacidade deve ser um número positivo.', 400);
    }
    if (!qr_code || typeof qr_code !== 'string' || !qr_code.trim()) {
      throw new AppError('O campo qr_code é obrigatório.', 400);
    }
    if (!Array.isArray(horarios) || horarios.length === 0) {
      throw new AppError('É necessário atribuir pelo menos um horário de funcionamento para a sala.', 400);
    }

    const sala = await salaService.criarSala({
      id_predio: Number(id_predio),
      nome: nome.trim(),
      capacidade: Number(capacidade),
      qr_code: qr_code.trim(),
      horarios,
    });

    return res.status(201).json(sala);
  }

  // Listar Salas
  async listar(req: Request, res: Response) {
    const { id_predio } = req.query;

    const predioId = id_predio ? Number(id_predio) : undefined;
    const salas = await salaService.listarSalas(predioId);

    return res.status(200).json(salas);
  }

  async filtrar(req: Request, res: Response) {
    const { nome, tipo, bloco, capacidade, capacidade_minima, ativa } = req.query;

    // Converte os parâmetros da query string
    const capacidadeNum = capacidade ? parseInt(String(capacidade), 10) : undefined;
    const capacidadeMinNum = capacidade_minima ? parseInt(String(capacidade_minima), 10) : undefined;

    const salas = await salaService.filtrarSalas({
      nome: nome ? String(nome) : undefined,
      tipo: tipo ? String(tipo) : undefined,
      bloco: bloco ? String(bloco) : undefined,
      capacidade: capacidadeNum,
      capacidade_minima: capacidadeMinNum,
      ativa: ativa !== undefined ? ativa === 'true' : undefined,
    });

    return res.status(200).json(salas);
  }
  // Buscar Sala por ID
  async buscarPorId(req: Request, res: Response) {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('O ID da sala informado na URL é inválido.', 400);
    }

    const sala = await salaService.buscarPorId(Number(id));

    return res.status(200).json(sala);
  }

  // Atualizar Sala
  async atualizar(req: Request, res: Response) {
    const { id } = req.params;
    const { id_predio, nome, capacidade, qr_code, horarios } = req.body;

    if (!id || isNaN(Number(id))) {
      throw new AppError('O ID da sala informado na URL é inválido.', 400);
    }

    const sala = await salaService.atualizarSala(Number(id), {
      id_predio: id_predio ? Number(id_predio) : undefined,
      nome,
      capacidade: capacidade ? Number(capacidade) : undefined,
      qr_code,
      horarios,
    });

    return res.status(200).json(sala);
  }

  // Desativar Sala
  async desativar(req: Request, res: Response) {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('O ID da sala informado na URL é inválido.', 400);
    }

    await salaService.desativarSala(Number(id));

    return res.status(200).json({ mensagem: 'Sala desativada com sucesso.' });
  }

  // Reativar Sala
  async reativar(req: Request, res: Response) {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      throw new AppError('O ID da sala informado na URL é inválido.', 400);
    }

    await salaService.reativarSala(Number(id));

    return res.status(200).json({ mensagem: 'Sala reativada com sucesso.' });
  }
}

export const salaController = new SalaController();