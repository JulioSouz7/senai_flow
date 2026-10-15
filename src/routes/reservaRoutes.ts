import { Router } from 'express';
import { ReservaController } from '../controllers/reservaController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const reservaRoutes = Router();
const reservaController = new ReservaController();

reservaRoutes.use(isAuthenticated);

reservaRoutes.get('/', (req, res) => reservaController.listar(req, res));
reservaRoutes.get('/:id', (req, res) => reservaController.buscarPorId(req, res));
reservaRoutes.post('/', (req, res) => reservaController.criar(req, res));

// Validação/Aprovação geral (ADMINISTRADOR)
reservaRoutes.patch('/:id/validar', checkRole(['ADMINISTRADOR']), (req, res) => reservaController.validar(req, res));

// Rota de cancelamento
reservaRoutes.patch('/:id/cancelar', (req, res) => {
  // Define o status como CANCELADA e chama o método validar do controller
  req.body.status = 'CANCELADA';
  return reservaController.validar(req, res);
});

export default reservaRoutes;