import { Request, Response } from 'express';
import { SolicitacaoEquipamentoService } from '../services/solicitacaoEquipamentoService';

const solicitacaoService = new SolicitacaoEquipamentoService();

export class SolicitacaoEquipamentoController {
    async criar(req: Request, res: Response) {
        const id_usuario = (req as any).user_id;
        const { id_reserva, itens } = req.body;

        const solicitacao = await solicitacaoService.criarSolicitacao(
            Number(id_usuario),
            Number(id_reserva),
            itens
        );

        return res.status(201).json({
            message: 'Solicitação de equipamentos criada com sucesso.',
            solicitacao,
        });
    }

    async listar(req: Request, res: Response) {
        const id_usuario = (req as any).user_id;
        const solicitacoes = await solicitacaoService.listarSolicitacoes(Number(id_usuario));
        return res.status(200).json(solicitacoes);
    }

    async atualizarStatus(req: Request, res: Response) {
        const id_usuario_admin = (req as any).user_id;
        const { id } = req.params;
        const { status } = req.body;

        const solicitacaoAtualizada = await solicitacaoService.analisarSolicitacao(
            Number(id_usuario_admin),
            Number(id),
            status
        );

        return res.status(200).json({
            message: `Solicitação atualizada para ${solicitacaoAtualizada.status} com sucesso.`,
            solicitacao: solicitacaoAtualizada,
        });
    }

    async cancelar(req: Request, res: Response) {
        const id_usuario = (req as any).user_id;
        const { id } = req.params;

        await solicitacaoService.cancelarSolicitacao(
            Number(id_usuario),
            Number(id)
        );

        return res.status(200).json({
            message: 'Solicitação de equipamentos cancelada com sucesso.',
        });
    }
}