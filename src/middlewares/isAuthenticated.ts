import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

interface TokenPayload {
  sub: string;
  perfil: string; // Chave exata utilizada no UsuarioService
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const secret = process.env.JWT_SECRET || 'secreto_senai_flow';
    const decoded = verify(token, secret) as TokenPayload;

    // Injeta o ID e o Perfil do utilizador dentro do req para os próximos middlewares
    (req as any).user_id = decoded.sub; 
    (req as any).user_perfil = decoded.perfil; 

    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}