import { Router } from 'express';
import { pontuacaoController } from '../controllers/pontuacaoController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';

const pontuacaoRoutes = Router();

pontuacaoRoutes.use(ensureAuthenticated);

// Rotas de Leitura
pontuacaoRoutes.get('/ranking', (req, res) => pontuacaoController.obterRanking(req, res));
pontuacaoRoutes.get('/docente/:id_docente', (req, res) => pontuacaoController.buscarHistoricoDocente(req, res));

// Rota restrita ao Administrador para registros manuais
pontuacaoRoutes.post('/', ensureAdmin, (req, res) => pontuacaoController.registrar(req, res));

export { pontuacaoRoutes };