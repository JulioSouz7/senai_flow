import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export function ensureAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;

  if (!user || user.perfil !== 'ADMINISTRADOR') {
    throw new AppError('Acesso negado. Apenas administradores têm permissão.', 403);
  }

  return next();
}