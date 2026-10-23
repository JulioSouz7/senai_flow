import { Router } from 'express';
import usuarioRoutes from './usuarioRoutes';
import { salaRoutes } from './salaRoutes';
import predioRoutes from './predioRoutes';
import equipamentoRoutes from './equipamentoRoutes';
import turmaRoutes from './turmaRoutes';
import {reservaRoutes} from './reservaRoutes';
import {avariaRoutes} from './avariaRoutes';
import comunicadoRoutes from './comunicadoRoutes';
import trocaSalaRoutes from './trocaSalaRoutes';
import dashboardRoutes from './dashboardRoutes';
import { relatoRoutes } from './relatoSugestaoRoutes';
// import reservaDetalhesRoutes from './reservaDetalhesRoutes';
import solicitacaoRoutes from './solicitacaoEquipamentoRoutes';
import usuarioPerfilRoutes from './usuarioPerfilRoutes';
import { areaRiscoRoutes } from './areaRiscoRoutes';
// import pontuacaoRoutes from './pontuacaoRoutes';

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
routes.use('/relatos-sugestoes', relatoRoutes);
// routes.use('/reservas-detalhes', reservaDetalhesRoutes);
routes.use('/solicitacoes-equipamentos', solicitacaoRoutes);
routes.use('/registro', usuarioPerfilRoutes);
routes.use('/usuarios', usuarioPerfilRoutes);
routes.use('/areas-risco', areaRiscoRoutes);
// routes.use('/pontuacao', pontuacaoRoutes);

export default routes;