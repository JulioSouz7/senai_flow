import { Router } from 'express';
import { AvariaController } from '../controllers/avariaController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const avariaRoutes = Router();
const avariaController = new AvariaController();

avariaRoutes.use(isAuthenticated);

avariaRoutes.get('/', (req, res) => avariaController.listar(req, res));
avariaRoutes.get('/:id', (req, res) => avariaController.buscarPorId(req, res));
avariaRoutes.post('/', (req, res) => avariaController.criar(req, res));
avariaRoutes.patch('/:id/status', checkRole(['ADMINISTRADOR']), (req, res) => avariaController.atualizarStatus(req, res));

export default avariaRoutes;