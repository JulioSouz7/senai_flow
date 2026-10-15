import { Router } from 'express';
import { SugestaoController } from '../controllers/sugestaoController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const sugestaoRoutes = Router();
const sugestaoController = new SugestaoController();

sugestaoRoutes.use(isAuthenticated);

// Alunos e Docentes podem listar e enviar sugestões/reclamações
sugestaoRoutes.get('/', (req, res) => sugestaoController.listar(req, res));
sugestaoRoutes.get('/:id', (req, res) => sugestaoController.buscarPorId(req, res));
sugestaoRoutes.post('/', (req, res) => sugestaoController.criar(req, res));

// Apenas Administradores respondem os relatos
sugestaoRoutes.patch('/:id/responder', checkRole(['ADMINISTRADOR']), (req, res) => sugestaoController.responder(req, res));

export default sugestaoRoutes;