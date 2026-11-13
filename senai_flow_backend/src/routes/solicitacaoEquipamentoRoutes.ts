import { Router } from 'express';
import { SolicitacaoEquipamentoController } from '../controllers/solicitacaoEquipamentoController';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const solicitacaoRoutes = Router();
const solicitacaoController = new SolicitacaoEquipamentoController();

solicitacaoRoutes.use(isAuthenticated);

// Listar todas as solicitações
solicitacaoRoutes.get('/', (req, res) => solicitacaoController.listar(req, res));

// Docente solicita equipamento para uma reserva (Status inicial: enviado)
solicitacaoRoutes.post('/', (req, res) => solicitacaoController.criar(req, res));

// Atualizar status e vincular admin de análise
solicitacaoRoutes.patch('/:id/status', (req, res) => solicitacaoController.atualizarStatus(req, res));

solicitacaoRoutes.delete('/:id', isAuthenticated, (req, res) =>
  solicitacaoController.cancelar(req, res)
);

export default solicitacaoRoutes;