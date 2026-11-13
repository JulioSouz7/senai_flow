import { Router } from 'express';
import { RelatoSugestaoController } from '../controllers/relatoSugestaoController';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const relatoRoutes = Router();
const relatoController = new RelatoSugestaoController();

// Aplica autenticação para todas as rotas de relatos/sugestões abaixo
relatoRoutes.use(isAuthenticated);

// 1. Criar relato (Todos)
relatoRoutes.post('/', (req, res) => relatoController.criar(req, res));

// 2. Listar relatos
relatoRoutes.get('/', (req, res) => relatoController.listar(req, res));

// 3. Buscar relatos por id_usuario (Alunos, Docentes ou Admins)
relatoRoutes.get('/usuario/:id_usuario', (req, res) =>
  relatoController.buscarPorIdUsuario(req, res)
);

// 4. Responder / Atualizar Status (Admin)
relatoRoutes.patch('/:id/responder', (req, res) =>
  relatoController.responder(req, res)
);

// 5. Arquivar (Admin)
relatoRoutes.patch('/:id/arquivar', (req, res) =>
  relatoController.arquivar(req, res)
);

export { relatoRoutes };