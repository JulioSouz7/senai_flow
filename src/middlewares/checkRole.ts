import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

interface TokenPayload {
  perfil: string;
}

export function checkRole(rolesPermitidas: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Tenta pegar do req (se o isAuthenticated tiver injetado)
    let userPerfil = (req as any).user_perfil;

    // 2. Se não estiver no req, decodifica do header Authorization
    if (!userPerfil) {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const [, token] = authHeader.split(' ');
        try {
          const decoded = verify(
            token, 
            process.env.JWT_SECRET || 'secreto_senai_flow'
          ) as TokenPayload;
          userPerfil = decoded.perfil;
        } catch {
          throw new AppError('Token inválido', 401);
        }
      }
    }

    if (!userPerfil || !rolesPermitidas.includes(userPerfil)) {
      throw new AppError('Acesso negado: Perfil não possui permissão para esta operação', 403);
    }

    return next();
  };
}