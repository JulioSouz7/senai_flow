import { NextFunction, Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

interface Payload {
  sub: string;
}

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authToken = req.headers.authorization;

  // 1. Sem cabeçalho Authorization
  if (!authToken) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const [, token] = authToken.split(" ");

  try {
    const { sub } = verify(
      token,
      process.env.JWT_SECRET || 'secreto_senai_flow'
    ) as Payload;

    (req as any).user_id = sub;

    return next();
  } catch (err) {
    // 2. Token inválido, malformatado ou assinado com chave diferente
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}