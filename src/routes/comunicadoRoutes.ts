import { Router } from 'express';
import { comunicadoController } from '../controllers/comunicadoController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const comunicadoRoutes = Router();

comunicadoRoutes.use(ensureAuthenticated);

// Rotas de Leitura (Todos os usuários autenticados)
comunicadoRoutes.get('/minha-turma', (req, res) => comunicadoController.buscarMinhaTurma(req, res));
comunicadoRoutes.get('/', (req, res) => comunicadoController.listarGerais(req, res));
comunicadoRoutes.get('/:id', (req, res) => comunicadoController.buscarPorId(req, res)); // <-- ADICIONA ESTA LINHA!

// Rotas de Modificação (Restritas EXCLUSIVAMENTE a ADMINISTRADOR)
comunicadoRoutes.post('/', checkRole(['ADMINISTRADOR']), (req, res) => comunicadoController.criar(req, res));
comunicadoRoutes.delete('/:id', checkRole(['ADMINISTRADOR']), (req, res) => comunicadoController.deletar(req, res));

export { comunicadoRoutes };