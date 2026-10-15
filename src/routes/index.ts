import { Router } from 'express';
import usuarioRoutes from './usuarioRoutes';
import salaRoutes from './salaRoutes';
import predioRoutes from './predioRoutes';
import equipamentoRoutes from './equipamentoRoutes';
import turmaRoutes from './turmaRoutes';
import reservaRoutes from './reservaRoutes';
import avariaRoutes from './avariaRoutes';
import comunicadoRoutes from './comunicadoRoutes';
import trocaSalaRoutes from './trocaSalaRoutes';
import dashboardRoutes from './dashboardRoutes';
import sugestaoRoutes from './sugestaoRoutes';
import reservaDetalhesRoutes from './reservaDetalhesRoutes';
import pontuacaoRoutes from './pontuacaoRoutes';

const routes = Router();

routes.use('/usuarios', usuarioRoutes);
routes.use('/salas', salaRoutes);
routes.use('/predios', predioRoutes);
routes.use('/equipamentos', equipamentoRoutes);
routes.use('/turmas', turmaRoutes);
routes.use('/reservas', reservaRoutes);
routes.use('/avarias', avariaRoutes);
routes.use('/comunicados', comunicadoRoutes);
routes.use('/trocas-sala', trocaSalaRoutes);
routes.use('/dashboard', dashboardRoutes);
routes.use('/sugestoes', sugestaoRoutes);
routes.use('/reservas-detalhes', reservaDetalhesRoutes);
routes.use('/pontuacao', pontuacaoRoutes);

export default routes;