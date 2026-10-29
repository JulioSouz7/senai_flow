import { Request, Response } from 'express';
import { AdministradorService } from '../services/administradorService';
import prisma from '../config/prisma';
import jwt from 'jsonwebtoken';

const administradorService = new AdministradorService();

export class AdministradorController {
  async criar(req: Request, res: Response) {
    try {
      const { nome, email, senha, nif } = req.body;

      if (!nome || !email || !nif) {
        return res.status(400).json({ message: 'Nome, e-mail e NIF são obrigatórios.' });
      }

      const totalAdmins = await prisma.administrador.count();
      if (totalAdmins > 0) {
        return res.status(403).json({ 
          message: 'Já existe um administrador no sistema. Novos administradores devem ser criados por um usuário logado.' 
        });
      }

      const novoAdmin = await administradorService.criar({ nome, email, senha, nif });
      
      // 2. Gera o token usando a mesma lógica do seu UsuarioService
      const secret = process.env.JWT_SECRET || 'secreto_senai_flow';
      const token = jwt.sign(
        {
          email: novoAdmin.email,
          perfil: novoAdmin.perfil,
          id_docente: null,
          id_adm: novoAdmin.id_adm, // ID do admin que acabou de ser criado
          id_aluno: null,
        },
        secret,
        {
          subject: String(novoAdmin.id_usuario),
          expiresIn: '8h',
        }
      );
      
      return res.status(201).json({
        message: 'Primeiro Administrador criado com sucesso!',
        token, // 3. Retorna o token na resposta
        administrador: novoAdmin
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return res.status(statusCode).json({ message: error.message || 'Erro interno do servidor.' });
    }
  }
}