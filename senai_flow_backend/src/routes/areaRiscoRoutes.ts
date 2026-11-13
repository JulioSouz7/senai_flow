import { Router } from 'express';
import { AreaRiscoController } from '../controllers/areaRiscoController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';
import { upload } from '../config/multer'; 

const areaRiscoRoutes = Router();
const areaRiscoController = new AreaRiscoController();

// Todas as rotas exigem autenticação prévia
areaRiscoRoutes.use(ensureAuthenticated);

// Rotas de Leitura (Alunos, Docentes e Admins)
areaRiscoRoutes.get('/', areaRiscoController.listar);
areaRiscoRoutes.get('/:id', areaRiscoController.buscarPorId);

// Rotas de Escrita/Alteração (Restritas a Administradores com upload de imagem)
areaRiscoRoutes.post(
  '/',
  ensureAdmin,
  upload.single('imagem'),
  areaRiscoController.criar
);

areaRiscoRoutes.put(
  '/:id',
  ensureAdmin,
  upload.single('imagem'),
  areaRiscoController.atualizar
);

areaRiscoRoutes.patch(
  '/:id/desativar',
  ensureAdmin,
  areaRiscoController.desativar
);

export { areaRiscoRoutes };