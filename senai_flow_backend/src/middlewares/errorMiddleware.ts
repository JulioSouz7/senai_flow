import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

function getPrismaError(error: Prisma.PrismaClientKnownRequestError): AppError | undefined {
  const target = error.meta?.target;
  const fields = Array.isArray(target)
    ? target.map(String).join(' ')
    : typeof target === 'string'
      ? target
      : '';

  switch (error.code) {
    case 'P2000':
      return new AppError('Um ou mais campos excedem o tamanho permitido.', 400);
    case 'P2002':
      if (fields.includes('email')) return new AppError('Este e-mail já está cadastrado.', 409);
      if (fields.includes('matricula')) return new AppError('Esta matrícula já está cadastrada.', 409);
      if (fields.includes('nif')) return new AppError('Este NIF já está cadastrado.', 409);
      if (fields.includes('qr_code')) return new AppError('Este QR code já está cadastrado.', 409);
      if (fields.includes('id_sala_horario')) return new AppError('Este horário já está reservado para esta sala.', 409);
      return new AppError('Já existe um registro com esses dados.', 409);
    case 'P2003':
      return new AppError('Não foi possível concluir a operação devido a um vínculo inválido ou existente.', 409);
    case 'P2011':
      return new AppError('Um campo obrigatório não foi informado.', 400);
    case 'P2012':
    case 'P2013':
      return new AppError('Um ou mais campos obrigatórios não foram informados.', 400);
    case 'P2014':
      return new AppError('A operação viola um relacionamento obrigatório entre registros.', 409);
    case 'P2015':
    case 'P2018':
      return new AppError('Um dos registros relacionados não foi encontrado.', 404);
    case 'P2020':
      return new AppError('Um ou mais valores estão fora do intervalo permitido.', 400);
    case 'P2023':
      return new AppError('Um ou mais dados informados possuem formato inválido.', 400);
    case 'P2025':
      return new AppError('Registro não encontrado.', 404);
    case 'P2034':
      return new AppError('O registro foi alterado por outra operação. Tente novamente.', 409);
    default:
      return undefined;
  }
}

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const appError = getPrismaError(error);
    if (appError) {
      return res.status(appError.statusCode).json({
        status: 'error',
        message: appError.message,
      });
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      status: 'error',
      message: 'Os dados informados são inválidos.',
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      status: 'validation_error',
      errors: error.issues.map((issue) => ({
        campo: issue.path.join('.'),
        mensagem: issue.message,
      })),
    });
  }

  if (error instanceof multer.MulterError) {
    const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'O arquivo enviado excede o tamanho permitido.'
      : 'O arquivo enviado não pôde ser processado.';
    return res.status(statusCode).json({ status: 'error', message });
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      status: 'error',
      message: 'O corpo da requisição contém JSON inválido.',
    });
  }

  console.error('❌ Internal Server Error:', error);

  return res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor',
  });
}