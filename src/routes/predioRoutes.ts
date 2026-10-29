import { Router } from 'express';
import { PredioController } from '../controllers/predioController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const predioRoutes = Router();
const predioController = new PredioController();

predioRoutes.use(isAuthenticated);

predioRoutes.get('/', (req, res) => predioController.listar(req, res));
predioRoutes.get('/:id', (req, res) => predioController.buscarPorId(req, res));

predioRoutes.post('/', checkRole(['ADMINISTRADOR']), (req, res) => predioController.criar(req, res));
predioRoutes.put('/:id', checkRole(['ADMINISTRADOR']), (req, res) => predioController.atualizar(req, res));

export default predioRoutes;