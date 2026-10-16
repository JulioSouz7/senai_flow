// import { Router } from 'express';
// import { PontuacaoController } from '../controllers/pontuacaoController';
// import { isAuthenticated } from '../middlewares/isAuthenticated';

// const pontuacaoRoutes = Router();
// const pontuacaoController = new PontuacaoController();

// pontuacaoRoutes.use(isAuthenticated);

// // Rota POST principal da pontuação
// pontuacaoRoutes.post('/', (req, res) => pontuacaoController.registrar(req, res));

// // Outras rotas
// pontuacaoRoutes.get('/ranking', (req, res) => pontuacaoController.obterRanking(req, res));
// pontuacaoRoutes.get('/turma/:id_turma', (req, res) => pontuacaoController.listarPorTurma(req, res));
// pontuacaoRoutes.delete('/reset', (req, res) => pontuacaoController.resetSemestral(req, res));

// export default pontuacaoRoutes;