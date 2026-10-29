import { Request, Response } from 'express';
import { SolicitacaoEquipamentoService } from '../services/solicitacaoEquipamentoService';

const solicitacaoService = new SolicitacaoEquipamentoService();

export class SolicitacaoEquipamentoController {
    async criar(req: Request, res: Response) {
        try {
            const id_usuario = (req as any).user_id;

            if (!id_usuario) {
                return res.status(401).json({
                    error: true,
                    message: 'Usuário não autenticado ou ID ausente no token.',
                });
            }

            const { id_reserva, itens } = req.body;

            const solicitacao = await solicitacaoService.criarSolicitacao(
                Number(id_usuario),
                Number(id_reserva),
                itens
            );

            return res.status(201).json({
                message: 'Solicitação de equipamento criada com sucesso!',
                solicitacao,
            });
        } catch (error: any) {
            return res.status(error.statusCode || 400).json({
                error: true,
                message: error.message || 'Erro ao solicitar equipamentos.',
            });
        }
    }

    async listar(req: Request, res: Response) {
        try {
            const solicitacoes = await solicitacaoService.listarSolicitacoes();
            return res.status(200).json(solicitacoes);
        } catch (error: any) {
            return res.status(error.statusCode || 400).json({
                error: true,
                message: error.message || 'Erro ao buscar solicitações.',
            });
        }
    }

    async atualizarStatus(req: Request, res: Response) {
        try {
            const id_usuario_admin = (req as any).user_id;

            if (!id_usuario_admin) {
                return res.status(401).json({
                    error: true,
                    message: 'Usuário não autenticado ou ID ausente no token.',
                });
            }

            const { id } = req.params;
            const { status } = req.body;

            const solicitacaoAtualizada = await solicitacaoService.analisarSolicitacao(
                Number(id_usuario_admin),
                Number(id),
                status
            );

            return res.status(200).json({
                message: `Solicitação atualizada para ${status} com sucesso!`,
                solicitacao: solicitacaoAtualizada,
            });
        } catch (error: any) {
            return res.status(error.statusCode || 400).json({
                error: true,
                message: error.message || 'Erro ao atualizar status da solicitação.',
            });
        }
    }
    // Adicionar dentro da classe SolicitacaoEquipamentoController:

    // Adicionar dentro da classe SolicitacaoEquipamentoController:

    async cancelar(req: Request, res: Response) {
        try {
            const id_usuario = (req as any).user_id;

            if (!id_usuario) {
                return res.status(401).json({
                    error: true,
                    message: 'Utilizador não autenticado ou ID ausente no token.',
                });
            }

            const { id } = req.params;

            await solicitacaoService.cancelarSolicitacao(
                Number(id_usuario),
                Number(id)
            );

            return res.status(200).json({
                message: 'Solicitação de equipamento cancelada!',
            });
        } catch (error: any) {
            return res.status(error.statusCode || 400).json({
                error: true,
                message: error.message || 'Erro ao cancelar a solicitação.',
            });
        }
    }
}