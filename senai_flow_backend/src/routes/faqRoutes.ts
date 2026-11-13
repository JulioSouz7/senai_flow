import { Router } from 'express';
import { faqController } from '../controllers/faqController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';

const faqRoutes = Router();

// Rotas públicas (ou apenas com autenticação para alunos/docentes consultarem)
faqRoutes.use(ensureAuthenticated);

faqRoutes.get('/', (req, res) => faqController.listar(req, res));
faqRoutes.get('/:id', (req, res) => faqController.buscarPorId(req, res));

// Rotas administrativas (criação, edição e exclusão restritas ao ADM)
faqRoutes.post('/', ensureAdmin, (req, res) => faqController.criar(req, res));
faqRoutes.put('/:id', ensureAdmin, (req, res) => faqController.atualizar(req, res));
faqRoutes.delete('/:id', ensureAdmin, (req, res) => faqController.deletar(req, res));

export { faqRoutes };