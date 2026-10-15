import { z } from 'zod';

// Autenticação & Usuários
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(1, 'Senha obrigatória'),
  }),
});

export const primeiroAcessoSchema = z.object({
  body: z.object({
    id_usuario: z.number(),
    senha_atual: z.string().min(1),
    nova_senha: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
  }),
});

// Avarias (RF03, RN18)
export const criarAvariaSchema = z.object({
  body: z.object({
    id_sala: z.number().optional(),
    id_equipamento: z.number().optional(),
    foto_url: z.string().url('URL da foto inválida'),
    descricao: z.string().min(30, 'A descrição deve conter no mínimo 30 caracteres'),
    gravidade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']),
  }),
});

// Suporte & Chamados (RF04, RN02)
export const criarChamadoSchema = z.object({
  body: z.object({
    assunto: z.string().min(5),
    mensagem: z.string().min(10),
    categoria: z.string(),
  }),
});

// Check-out & Pontuação (RF05, RN15, RN25)
export const encerrarReservaSchema = z.object({
  body: z.object({
    sala_em_ordem: z.boolean(),
    observacoes: z.string().optional(),
    pontos_desconto: z.number().min(0).max(10).optional(),
  }),
});

// Relatos & Sugestões (RF06, RN12, RN17)
export const criarSugestaoSchema = z.object({
  body: z.object({
    titulo: z.string().min(5),
    conteudo: z.string().min(15),
  }),
});

// Comunicados (RF08, RF11, RN10)
export const criarComunicadoSchema = z.object({
  body: z.object({
    titulo: z.string().min(3),
    mensagem: z.string().min(10),
    id_turma: z.number().optional(), // Se nulo, enviado para geral
  }),
});

// Solicitação de Equipamentos (RF01, RN13)
export const solicitarEquipamentoSchema = z.object({
  body: z.object({
    id_reserva: z.number(),
    id_equipamento: z.number(),
    observacao: z.string().optional(),
  }),
});

// Reservas & Troca (RF02, RF14, RF19, RN06, RN08, RN26, RN32)
export const criarReservaSchema = z.object({
  body: z.object({
    id_sala: z.number(),
    id_turma: z.number(),
    id_docente: z.number(),
    data: z.string(),
    hora_inicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    hora_fim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    tipo: z.enum(['NORMAL', 'URGENTE']),
    justificativa_urgencia: z.string().optional(),
  }),
});

export const solicitarTrocaSalaSchema = z.object({
  body: z.object({
    id_reserva_origem: z.number(),
    id_docente_destino: z.number(),
    motivo: z.string().min(10),
  }),
});