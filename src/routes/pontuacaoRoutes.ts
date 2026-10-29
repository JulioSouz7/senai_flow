import { Router } from 'express';
import { pontuacaoController } from '../controllers/pontuacaoController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const pontuacaoRoutes = Router();

pontuacaoRoutes.use(ensureAuthenticated);

// Obter ranking de salas mais organizadas
pontuacaoRoutes.get('/ranking', (req, res) => pontuacaoController.ranking(req, res));

// Obter histórico de pontuação de uma sala específica
pontuacaoRoutes.get('/sala/:id_sala', (req, res) => pontuacaoController.historicoSala(req, res));

export { pontuacaoRoutes };