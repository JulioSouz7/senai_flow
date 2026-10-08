import { Router } from 'express';
import { ReservaController } from '../controllers/reservaController';

const reservaRoutes = Router();
const reservaController = new ReservaController();

reservaRoutes.get('/', (req, res) => reservaController.listar(req, res));
reservaRoutes.get('/:id', (req, res) => reservaController.buscarPorId(req, res));
reservaRoutes.post('/', (req, res) => reservaController.criar(req, res));

export default reservaRoutes;