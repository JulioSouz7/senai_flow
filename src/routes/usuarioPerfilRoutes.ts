import { Router } from 'express';
import { UsuarioPerfilController } from '../controllers/usuarioPerfilController';
import { ensureAdmin } from '../middlewares/ensureAdmin';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const usuarioPerfilRoutes = Router();
usuarioPerfilRoutes.use(ensureAuthenticated);

const usuarioPerfilController = new UsuarioPerfilController();

usuarioPerfilRoutes.post('/alunos', (req, res) =>
  usuarioPerfilController.criarAluno(req, res)
);

usuarioPerfilRoutes.patch('/alunos/:id/situacao', (req, res) =>
  usuarioPerfilController.atualizarSituacaoAluno(req, res)
);

usuarioPerfilRoutes.post('/administrador', (req, res) =>
  usuarioPerfilController.criarAdministrador(req, res)
);

// Rotas de Docentes e Gestão de Turmas
usuarioPerfilRoutes.post('/docentes', ensureAdmin, (req, res) =>
  usuarioPerfilController.criarDocente(req, res)
);

usuarioPerfilRoutes.post('/docentes/:id_docente/turmas', ensureAdmin, (req, res) =>
  usuarioPerfilController.adicionarTurma(req, res)
);

usuarioPerfilRoutes.delete('/docentes/:id_docente/turmas/:id_turma', ensureAdmin, (req, res) =>
  usuarioPerfilController.removerTurma(req, res)
);

export default usuarioPerfilRoutes;