import { Router } from 'express';
import { ComunicadoController } from '../controllers/comunicadoController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const comunicadoRoutes = Router();
const comunicadoController = new ComunicadoController();

comunicadoRoutes.use(isAuthenticated);

// Todos os usuários autenticados podem visualizar comunicados
comunicadoRoutes.get('/', (req, res) => comunicadoController.listar(req, res));
comunicadoRoutes.get('/:id', (req, res) => comunicadoController.buscarPorId(req, res));

// Apenas ADMINISTRADOR pode emitir e apagar comunicados
comunicadoRoutes.post('/', checkRole(['ADMINISTRADOR']), (req, res) => comunicadoController.criar(req, res));
comunicadoRoutes.delete('/:id', checkRole(['ADMINISTRADOR']), (req, res) => comunicadoController.deletar(req, res));

export default comunicadoRoutes;