import { Router } from 'express';
import { TurmaController } from '../controllers/turmaController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const turmaRoutes = Router();
const turmaController = new TurmaController();

turmaRoutes.use(isAuthenticated);

turmaRoutes.get('/', (req, res) => turmaController.listar(req, res));
turmaRoutes.get('/:id', (req, res) => turmaController.buscarPorId(req, res));

turmaRoutes.post('/', checkRole(['ADMINISTRADOR']), (req, res) => turmaController.criar(req, res));
turmaRoutes.put('/:id', checkRole(['ADMINISTRADOR']), (req, res) => turmaController.atualizar(req, res));
turmaRoutes.delete('/:id', checkRole(['ADMINISTRADOR']), (req, res) => turmaController.deletar(req, res));
turmaRoutes.put('/:id', checkRole(['ADMINISTRADOR']), (req, res) => turmaController.atualizar(req, res));
turmaRoutes.post('/vincular-docente', turmaController.vincularDocente);

export default turmaRoutes;