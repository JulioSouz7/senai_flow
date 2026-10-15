import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const dashboardRoutes = Router();
const dashboardController = new DashboardController();

dashboardRoutes.use(isAuthenticated);

dashboardRoutes.get('/', (req, res) => dashboardController.obterResumo(req, res));

export default dashboardRoutes;