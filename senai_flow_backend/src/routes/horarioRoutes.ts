import { Router } from 'express';
import { HorarioController } from '../controllers/horarioController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const horarioRoutes = Router();
const horarioController = new HorarioController();

horarioRoutes.use(isAuthenticated);

horarioRoutes.get('/', (req, res) => horarioController.listar(req, res));
horarioRoutes.post('/', checkRole(['ADMINISTRADOR']), (req, res) => horarioController.criar(req, res));

export default horarioRoutes;