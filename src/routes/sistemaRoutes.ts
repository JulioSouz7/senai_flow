import { Router } from 'express';
import { SistemaController } from '../controllers/sistemaController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const sistemaRoutes = Router();
const sistemaController = new SistemaController();

sistemaRoutes.use(isAuthenticated);

// Avarias
sistemaRoutes.post('/avarias', (req, res) => sistemaController.criarAvaria(req, res));
sistemaRoutes.get('/avarias', checkRole(['ADMINISTRADOR']), (req, res) => sistemaController.listarAvarias(req, res));

// Suporte
sistemaRoutes.post('/suporte/chamados', (req, res) => sistemaController.abrirChamado(req, res));
sistemaRoutes.patch('/suporte/chamados/:id/responder', checkRole(['ADMINISTRADOR']), (req, res) => sistemaController.responderChamado(req, res));

// Sugestões
sistemaRoutes.post('/sugestoes', (req, res) => sistemaController.enviarSugestao(req, res));
sistemaRoutes.patch('/sugestoes/:id/arquivar', checkRole(['ADMINISTRADOR']), (req, res) => sistemaController.arquivarSugestao(req, res));

// Comunicados
sistemaRoutes.post('/comunicados', checkRole(['ADMINISTRADOR']), (req, res) => sistemaController.criarComunicado(req, res));
sistemaRoutes.get('/comunicados', (req, res) => sistemaController.listarComunicados(req, res));

export default sistemaRoutes;