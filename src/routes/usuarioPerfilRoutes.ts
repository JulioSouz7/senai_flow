import { Router } from 'express';
import { UsuarioPerfilController } from '../controllers/usuarioPerfilController';

const usuarioPerfilRoutes = Router();
const usuarioPerfilController = new UsuarioPerfilController();

usuarioPerfilRoutes.post('/alunos', (req, res) => usuarioPerfilController.criarAluno(req, res));
usuarioPerfilRoutes.patch('/alunos/:id/situacao', (req, res) => usuarioPerfilController.atualizarSituacaoAluno(req, res));
usuarioPerfilRoutes.post('/docentes', (req, res) => usuarioPerfilController.criarDocente(req, res));
usuarioPerfilRoutes.post('/administrador', (req, res) => usuarioPerfilController.criarAdministrador(req, res));

export default usuarioPerfilRoutes;