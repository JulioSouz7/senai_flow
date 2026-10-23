import { Router } from 'express';
import { avariaController } from '../controllers/avariaController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';

const avariaRoutes = Router();

// Exige autenticação JWT para todas as rotas do módulo de Avaria
avariaRoutes.use(ensureAuthenticated);

// 1. Criar/Registrar Avaria (Permitido para DOCENTE e ADMINISTRADOR com validação de NIF)
avariaRoutes.post('/', (req, res) => avariaController.registrar(req, res));

// 2. Listar todas as Avarias registradas
avariaRoutes.get('/', (req, res) => avariaController.listar(req, res));

// 3. Buscar uma Avaria específica por ID
avariaRoutes.get('/:id', (req, res) => avariaController.buscarPorId(req, res));

// 4. Intervenção/Atualização do Status da Avaria (Acesso restrito EXCLUSIVAMENTE a ADMINISTRADOR)
avariaRoutes.patch('/:id/status', ensureAdmin, (req, res) => avariaController.atualizarStatus(req, res));

export { avariaRoutes };