import { Router } from 'express';
import usuarioRoutes from './usuarioRoutes';
import salaRoutes from './salaRoutes';
import reservaRoutes from './reservaRoutes';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const routes = Router();

// Rota Pública
routes.use('/usuarios', usuarioRoutes);

// Rotas Protegidas
routes.use('/salas', isAuthenticated, salaRoutes);
routes.use('/reservas', isAuthenticated, reservaRoutes);

export default routes;