import { Router } from 'express';
import { UsuarioController } from '../controllers/usuarioController';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { checkRole } from '../middlewares/checkRole';

const usuarioRoutes = Router();
const usuarioController = new UsuarioController();

// Rota Pública - Autenticação e geração de Token JWT
usuarioRoutes.post('/login', (req, res) => usuarioController.login(req, res));

// Rotas Protegidas (Requerem Token JWT)
usuarioRoutes.use(isAuthenticated);

// Rota do próprio usuário autenticado
usuarioRoutes.post('/alterar-senha', (req, res) => usuarioController.alterarSenha(req, res));

// Rota restrita de Gestão - Listar usuários (Exclusivo para Administradores)
usuarioRoutes.get('/', checkRole(['ADMINISTRADOR']), (req, res) => usuarioController.listar(req, res));

export default usuarioRoutes;