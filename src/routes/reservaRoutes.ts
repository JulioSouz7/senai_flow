import { Router } from 'express';
import { reservaController } from '../controllers/reservaController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';

const reservaRoutes = Router();

// Exige autenticação JWT para todas as rotas de reserva
reservaRoutes.use(ensureAuthenticated);

// Rotas comuns (Docentes e Administradores)
reservaRoutes.get('/', (req, res) => reservaController.listar(req, res));
reservaRoutes.post('/', (req, res) => reservaController.criarReserva(req, res));
reservaRoutes.post('/urgencia', (req, res) => reservaController.solicitarUrgencia(req, res));
reservaRoutes.patch('/:id/cancelar', (req, res) => reservaController.cancelar(req, res));
reservaRoutes.patch('/:id/encerrar', (req, res) => reservaController.encerrar(req, res));

// Rotas restritas para Administradores
reservaRoutes.get('/pendentes', ensureAdmin, (req, res) => reservaController.listarPendentes(req, res));
reservaRoutes.patch('/:id/decidir', ensureAdmin, (req, res) => reservaController.decidir(req, res));
reservaRoutes.patch('/:id/decidir-urgencia', ensureAdmin, (req, res) => reservaController.decidirUrgencia(req, res));

export { reservaRoutes };