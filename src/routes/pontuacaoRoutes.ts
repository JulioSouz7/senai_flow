import { Router } from 'express';
import { PontuacaoController } from '../controllers/pontuacaoController';
import { isAuthenticated } from '../middlewares/isAuthenticated';

const pontuacaoRoutes = Router();
const pontuacaoController = new PontuacaoController();

pontuacaoRoutes.use(isAuthenticated);

// Consultar ranking e histórico por turma (Alunos, Docentes e Gestão - RU01)
pontuacaoRoutes.get('/ranking', (req, res) => pontuacaoController.obterRanking(req, res));
pontuacaoRoutes.get('/turma/:id_turma', (req, res) => pontuacaoController.listarPorTurma(req, res));

// Lançamento de pontuação pós-aula (Docentes / Admin)
pontuacaoRoutes.post('/', (req, res) => pontuacaoController.registrar(req, res));

// Reset semestral da pontuação (RN15 - Admin)
pontuacaoRoutes.delete('/reset', (req, res) => pontuacaoController.resetSemestral(req, res));

export default pontuacaoRoutes;