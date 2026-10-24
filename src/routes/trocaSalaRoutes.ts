import { Router } from 'express';
import { trocaSalaController } from '../controllers/trocaSalaController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const trocaSalaRoutes = Router();

trocaSalaRoutes.use(ensureAuthenticated);

trocaSalaRoutes.get('/', (req, res) => trocaSalaController.listar(req, res));
trocaSalaRoutes.get('/:id', (req, res) => trocaSalaController.buscarPorId(req, res));
trocaSalaRoutes.post('/', (req, res) => trocaSalaController.solicitar(req, res));
trocaSalaRoutes.patch('/:id/responder', (req, res) => trocaSalaController.responder(req, res));
// Aceita tanto DELETE como PATCH para o cancelamento
trocaSalaRoutes.delete('/:id', (req, res) => trocaSalaController.cancelar(req, res));
trocaSalaRoutes.patch('/:id/cancelar', (req, res) => trocaSalaController.cancelar(req, res));

export default trocaSalaRoutes;