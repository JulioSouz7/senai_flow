import { Router } from 'express';
import { SalaController } from '../controllers/salaController';

const salaRoutes = Router();
const salaController = new SalaController();

salaRoutes.get('/', (req, res) => salaController.listar(req, res));
salaRoutes.post('/', (req, res) => salaController.criar(req, res));

export default salaRoutes;