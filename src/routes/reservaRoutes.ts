import { Router } from 'express';
import { reservaController } from '../controllers/reservaController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';

const reservaRoutes = Router();

// Exige autenticação JWT para todas as rotas de reserva
reservaRoutes.use(ensureAuthenticated);

// Rotas para Docentes e Administradores
reservaRoutes.post('/', reservaController.criar);
reservaRoutes.post('/urgencia', reservaController.solicitarUrgencia);
reservaRoutes.patch('/:id/cancelar', reservaController.cancelar);

// Encerramento da reserva (recebe JSON com sala_em_ordem, houve_avaria e obs_encerramento)
reservaRoutes.patch('/:id/encerrar', reservaController.encerrar);

// Rotas EXCLUSIVAS da Administração (Aprovação / Recusa / Realocação)
reservaRoutes.patch('/:id/decidir', ensureAdmin, reservaController.decidir);
reservaRoutes.patch('/:id/decidir-urgencia', ensureAdmin, reservaController.decidirUrgencia);

// Rota de listagem de reservas (Acessível por Docentes e Admins autenticados)
reservaRoutes.get('/', reservaController.listar);

// Rota para buscar apenas reservas pendentes (Painel de Aprovação do Admin)
reservaRoutes.get('/pendentes', ensureAdmin, reservaController.listarPendentes);

export { reservaRoutes };