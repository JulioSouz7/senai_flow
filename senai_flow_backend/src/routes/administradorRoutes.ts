import { Router } from 'express';
import { AdministradorController } from '../controllers/administradorController';

const administradorRoutes = Router();
const administradorController = new AdministradorController();

// Não passamos middlewares de autenticação aqui para permitir a criação do PRIMEIRO admin
administradorRoutes.post('/', (req, res) => administradorController.criar(req, res));

export default administradorRoutes;