import { Request, Response } from 'express';
import { AreaRiscoService } from '../services/areaRiscoService';
import { AppError } from '../errors/AppError';

const areaRiscoService = new AreaRiscoService();

export class AreaRiscoController {

    async criar(req: Request, res: Response) {
        const { id_predio, nome, tipo, orientacao_seguranca, andar } = req.body;

        // 1. Extrai o id_adm injetado pelo middleware ensureAuthenticated
        const id_adm = (req as any).user?.id_adm;

        if (!id_adm || isNaN(Number(id_adm))) {
            throw new AppError('O usuário autenticado não possui um ID de administrador válido no token.', 403);
        }

        // 2. Validações dos campos vindos no req.body (sem pedir id_adm)
        if (!id_predio || isNaN(Number(id_predio))) {
            throw new AppError('O campo id_predio é obrigatório e deve ser numérico.', 400);
        }
        if (!nome || typeof nome !== 'string' || !nome.trim()) {
            throw new AppError('O campo nome é obrigatório.', 400);
        }
        if (!tipo || typeof tipo !== 'string' || !tipo.trim()) {
            throw new AppError('O campo tipo é obrigatório.', 400);
        }
        if (!orientacao_seguranca || typeof orientacao_seguranca !== 'string' || !orientacao_seguranca.trim()) {
            throw new AppError('O campo orientação de segurança é obrigatório.', 400);
        }
        if (andar === undefined || andar === null || isNaN(Number(andar))) {
            throw new AppError('O campo andar é obrigatório e deve ser numérico.', 400);
        }

        const reqFile = (req as any).file;
        const imagem_url = reqFile ? reqFile.path : undefined;

        const areaRisco = await areaRiscoService.criarAreaRisco({
            id_predio: Number(id_predio),
            id_adm: Number(id_adm),
            nome: nome.trim(),
            tipo: tipo.trim(),
            orientacao_seguranca: orientacao_seguranca.trim(),
            andar: Number(andar),
            imagem_url,
        });

        return res.status(201).json(areaRisco);
    }
    // Listar Áreas de Risco (com query parameters de filtro)
    async listar(req: Request, res: Response) {
        const { id_predio, andar, tipo } = req.query;

        const areasRisco = await areaRiscoService.listarAreasRisco({
            id_predio: id_predio ? Number(id_predio) : undefined,
            andar: andar !== undefined ? Number(andar) : undefined,
            tipo: tipo ? String(tipo) : undefined,
        });

        return res.status(200).json(areasRisco);
    }

    // Buscar por ID
    async buscarPorId(req: Request, res: Response) {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            throw new AppError('O ID enviado na URL deve ser numérico.', 400);
        }

        const areaRisco = await areaRiscoService.buscarPorId(Number(id));
        return res.status(200).json(areaRisco);
    }

    // Atualizar Área de Risco
    async atualizar(req: Request, res: Response) {
        const { id } = req.params;
        const { id_predio, nome, tipo, orientacao_seguranca, andar } = req.body;

        const reqFile = (req as any).file;
        const imagem_url = reqFile ? reqFile.path : undefined;

        if (!id || isNaN(Number(id))) {
            throw new AppError('O ID enviado na URL deve ser numérico.', 400);
        }

        const areaAtualizada = await areaRiscoService.atualizarAreaRisco(Number(id), {
            id_predio: id_predio ? Number(id_predio) : undefined,
            nome,
            tipo,
            orientacao_seguranca,
            andar: andar !== undefined ? Number(andar) : undefined,
            imagem_url,
        });

        return res.status(200).json(areaAtualizada);
    }
    // Desativar Área de Risco
    async desativar(req: Request, res: Response) {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            throw new AppError('O ID enviado na URL deve ser numérico.', 400);
        }

        await areaRiscoService.desativarAreaRisco(Number(id));
        return res.status(200).json({ mensagem: 'Área de risco desativada com sucesso.' });
    }
}