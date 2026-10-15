import { Router } from 'express';
import { TrocaSalaController } from '../controllers/trocaSalaController';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const trocaSalaRoutes = Router();
const trocaSalaController = new TrocaSalaController();

trocaSalaRoutes.use(isAuthenticated);

trocaSalaRoutes.get('/', (req, res) => trocaSalaController.listar(req, res));
trocaSalaRoutes.get('/:id', (req, res) => trocaSalaController.buscarPorId(req, res));
trocaSalaRoutes.post('/', (req, res) => trocaSalaController.solicitar(req, res));

// O docente responsável pela sala de destino aprova/aceita ou recusa a troca
trocaSalaRoutes.patch('/:id/responder', (req, res) => trocaSalaController.responder(req, res));

export default trocaSalaRoutes;