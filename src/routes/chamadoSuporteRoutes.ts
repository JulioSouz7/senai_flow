import { Router } from 'express';
import { chamadoSuporteController } from '../controllers/chamadoSuporteController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';

const chamadoSuporteRoutes = Router();

// Todas as rotas de suporte exigem autenticação via JWT
chamadoSuporteRoutes.use(ensureAuthenticated);

// Rotas comuns (Alunos, Docentes e Admins)
chamadoSuporteRoutes.post('/', (req, res) => chamadoSuporteController.criar(req, res));
chamadoSuporteRoutes.get('/', (req, res) => chamadoSuporteController.listar(req, res));
chamadoSuporteRoutes.get('/:id', (req, res) => chamadoSuporteController.buscarPorId(req, res));

// Rota restrita ao Administrador para assumir/atualizar o status
chamadoSuporteRoutes.patch('/:id/status', ensureAdmin, (req, res) =>
  chamadoSuporteController.atualizarStatus(req, res)
);

export { chamadoSuporteRoutes };