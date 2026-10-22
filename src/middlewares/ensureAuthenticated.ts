import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

interface TokenPayload {
  sub: string;      // ID do usuário
  id_adm?: number;  // ID do administrador (se for admin)
  perfil: string;
}

export function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token JWT não foi fornecido.', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = verify(token, process.env.JWT_SECRET || 'default_secret') as TokenPayload;

    (req as any).user = {
      id_usuario: Number(decoded.sub),
      id_adm: decoded.id_adm ? Number(decoded.id_adm) : Number(decoded.sub),
      perfil: decoded.perfil,
    };

    return next();
  } catch {
    throw new AppError('Token JWT inválido ou expirado.', 401);
  }
}