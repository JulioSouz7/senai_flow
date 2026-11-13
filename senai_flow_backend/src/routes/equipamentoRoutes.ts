import { Router } from 'express';
import { EquipamentoController } from '../controllers/equipamentoController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const equipamentoRoutes = Router();
const equipamentoController = new EquipamentoController();

equipamentoRoutes.use(isAuthenticated);

// Consultas gerais (Todos os usuários autenticados)
equipamentoRoutes.get('/', (req, res) => equipamentoController.listar(req, res));
equipamentoRoutes.get('/:id', (req, res) => equipamentoController.buscarPorId(req, res));

// Ações administrativas
equipamentoRoutes.post('/', checkRole(['ADMINISTRADOR']), (req, res) => equipamentoController.criar(req, res));
equipamentoRoutes.post('/vincular-sala', checkRole(['ADMINISTRADOR']), (req, res) => equipamentoController.vincularASala(req, res));
equipamentoRoutes.put('/:id', checkRole(['ADMINISTRADOR']), (req, res) => equipamentoController.atualizar(req, res));

export default equipamentoRoutes;