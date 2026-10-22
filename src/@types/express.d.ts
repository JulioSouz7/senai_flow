import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id_usuario: number;
        perfil: string;
        id_docente?: number;
        id_adm?: number;
        id_aluno?: number;
        nome?: string;
        email?: string;
      };
    }
  }
}

declare namespace Express {
  export interface Request {
    user: {
      id: number;
      tipo?: string;
    };
  }
}