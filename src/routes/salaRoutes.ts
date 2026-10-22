import { Router } from 'express';
import { salaController } from '../controllers/salaController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';

const salaRoutes = Router();

// Exige autenticação em todas as rotas
salaRoutes.use(ensureAuthenticated);

// Rotas de LEITURA (Acessíveis por qualquer perfil autenticado)
// ✅ Apenas UMA rota GET '/' apontando para a filtragem dinamica/listagem
salaRoutes.get('/', (req, res) => salaController.filtrar(req, res));
salaRoutes.get('/:id', salaController.buscarPorId);

// Rotas de ESCRITA (Restritas EXCLUSIVAMENTE para ADMINISTRADOR)
salaRoutes.post('/', ensureAdmin, salaController.criar);
salaRoutes.put('/:id', ensureAdmin, salaController.atualizar);
salaRoutes.patch('/:id/desativar', ensureAdmin, salaController.desativar);
salaRoutes.patch('/:id/reativar', ensureAdmin, salaController.reativar);

export { salaRoutes };