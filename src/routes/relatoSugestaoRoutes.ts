import { Router } from 'express';
import { RelatoSugestaoController } from '../controllers/relatoSugestaoController';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const relatoRoutes = Router();
const relatoController = new RelatoSugestaoController();

// 1. Criar (Todos)
relatoRoutes.post('/', isAuthenticated, (req, res) => relatoController.criar(req, res));

// 2. Listar
relatoRoutes.get('/', isAuthenticated, (req, res) => relatoController.listar(req, res));

// 3. Responder / Atualizar Status (Admin)
relatoRoutes.patch('/:id/responder', isAuthenticated, (req, res) =>
  relatoController.responder(req, res)
);

// 4. Arquivar (Admin)
relatoRoutes.patch('/:id/arquivar', isAuthenticated, (req, res) =>
  relatoController.arquivar(req, res)
);

export { relatoRoutes };