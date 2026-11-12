import { Request, Response } from 'express';
import { AdministradorService } from '../services/administradorService';
import prisma from '../config/prisma';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';

const administradorService = new AdministradorService();

export class AdministradorController {
  async criar(req: Request, res: Response) {
    const { nome, email, senha, nif } = req.body;

    if (!nome || !email || !nif) {
      throw new AppError('Nome, e-mail e NIF são obrigatórios.', 400);
    }

    const totalAdmins = await prisma.administrador.count();
    if (totalAdmins > 0) {
      throw new AppError('O administrador inicial já foi cadastrado.', 409);
    }

    const novoAdmin = await administradorService.criar({ nome, email, senha, nif });

    const secret = process.env.JWT_SECRET || 'secreto_senai_flow';
    const token = jwt.sign(
      {
        email: novoAdmin.email,
        perfil: novoAdmin.perfil,
        id_docente: null,
        id_adm: novoAdmin.id_adm,
        id_aluno: null,
      },
      secret,
      {
        subject: String(novoAdmin.id_usuario),
        expiresIn: '8h',
      }
    );

    return res.status(201).json({
      message: 'Administrador inicial cadastrado com sucesso!',
      token,
      administrador: novoAdmin
    });
  }
}