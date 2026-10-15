import { Router } from 'express';
import { ReservaDetalhesController } from '../controllers/reservaDetalhesController';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const reservaDetalhesRoutes = Router();
const reservaDetalhesController = new ReservaDetalhesController();

reservaDetalhesRoutes.use(isAuthenticated);

// Endpoints para RESERVA_HORARIO
reservaDetalhesRoutes.post('/horarios', (req, res) =>
  reservaDetalhesController.adicionarHorario(req, res)
);

// Endpoints para RESERVA_DOCENTE
reservaDetalhesRoutes.post('/docentes', (req, res) =>
  reservaDetalhesController.vincularDocente(req, res)
);

export default reservaDetalhesRoutes;