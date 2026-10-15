import { Router } from 'express';
import { SalaController } from '../controllers/salaController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const salaRoutes = Router();
const salaController = new SalaController();

salaRoutes.use(isAuthenticated);

// Consultas gerais (Qualquer usuário autenticado)
salaRoutes.get('/', (req, res) => salaController.listar(req, res));
salaRoutes.get('/:id', (req, res) => salaController.buscarPorId(req, res));

// Rotas exclusivas de gestão (Apenas ADMINISTRADOR)
salaRoutes.post('/', checkRole(['ADMINISTRADOR']), (req, res) => salaController.criar(req, res));
salaRoutes.put('/:id', checkRole(['ADMINISTRADOR']), (req, res) => salaController.atualizar(req, res));
salaRoutes.patch('/:id/desativar', checkRole(['ADMINISTRADOR']), (req, res) => salaController.desativar(req, res));
salaRoutes.patch('/:id/reativar', checkRole(['ADMINISTRADOR']), (req, res) => salaController.reativar(req, res));

export default salaRoutes;