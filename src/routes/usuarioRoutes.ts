import { Router } from 'express';
import { UsuarioController } from '../controllers/usuarioController';

const usuarioRoutes = Router();
const usuarioController = new UsuarioController();

usuarioRoutes.get('/', (req, res) => usuarioController.listar(req, res));
usuarioRoutes.post('/login', (req, res) => usuarioController.login(req, res));
usuarioRoutes.post('/alterar-senha', (req, res) => usuarioController.alterarSenha(req, res));

export default usuarioRoutes;