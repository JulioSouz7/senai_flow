import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { getJwtSecret } from '../config/jwt';

interface TokenPayload {
  sub: string;
  perfil: string; // Chave exata utilizada no UsuarioService
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Autenticação necessária. Faça login para continuar.', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = verify(token, getJwtSecret()) as TokenPayload;

    // Injeta o ID e o Perfil do utilizador dentro do req para os próximos middlewares
    (req as any).user_id = decoded.sub; 
    (req as any).user_perfil = decoded.perfil; 

    return next();
  } catch {
    throw new AppError('Sessão inválida ou expirada. Faça login novamente.', 401);
  }
}