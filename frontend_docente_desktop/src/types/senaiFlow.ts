// --- USUÁRIOS E AUTENTICAÇÃO ---
export type UserRole = "DOCENTE" | "ALUNO" | "GESTAO";

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  turmaId?: string;
  primeiroAcesso: boolean;
  ativo: boolean;
}

// --- SALAS E ATIVOS ---
export type EquipamentoStatus = "DISPONIVEL" | "EM_MANUTENCAO" | "INATIVO";

export interface Equipamento {
  id: string;
  patrimonioNif: string;
  nome: string;
  status: EquipamentoStatus;
  salaId: string;
}

export interface Sala {
  id: string;
  nome: string;
  bloco: string;
  capacidade: number;
  qrCodeUrl: string;
  equipamentos: Equipamento[];
}

// --- RESERVAS E TROCAS ---
export type TipoReserva = "REGULAR" | "EMERGENCIA";
export type StatusReserva = "PENDENTE" | "APROVADA" | "REJEITADA" | "CANCELADA";

export interface Reserva {
  id: string;
  salaId: string;
  docenteId: string;
  data: string;
  horarioInicio: string;
  horarioFim: string;
  tipo: TipoReserva;
  justificativaEmergencia?: string;
  status: StatusReserva;
  criadoEm: string;
}

export interface SolicitacaoTroca {
  id: string;
  reservaOrigemId: string;
  docenteSolicitanteId: string;
  docenteDestinatarioId: string;
  status: "PENDENTE" | "ACEITA" | "RECUSADA";
}

// --- AVARIAS E MANUTENÇÃO ---
export type PrioridadeAvaria = "BAIXA" | "MEDIA" | "ALTA";
export type StatusAvaria = "ABERTO" | "EM_ANALISE" | "CONCLUIDO";

export interface RelatorioAvaria {
  id: string;
  salaId: string;
  usuarioId: string;
  fotoUrl: string;
  descricao: string;
  prioridade: PrioridadeAvaria;
  status: StatusAvaria;
  dataAbertura: string;
}

// --- GAMIFICAÇÃO E CHECKLIST ---
export interface ChecklistEncerramento {
  id: string;
  reservaId: string;
  docenteId: string;
  salaLimpa: boolean;
  equipamentosDesligados: boolean;
  mesasOrganizadas: boolean;
  observacoes?: string;
  dataHora: string;
}

export interface TurmaPontuacao {
  turmaId: string;
  nomeTurma: string;
  pontosTotais: number;
  historicoPontos: {
    id: string;
    data: string;
    pontos: number;
    motivo: string;
  }[];
}

// --- MAPA DE RISCO E COMUNICADOS ---
export interface AreaRisco {
  id: string;
  bloco: string;
  titulo: string;
  descricao: string;
  nivelRisco: "BAIXO" | "MEDIO" | "ALTO";
  coordenadasPlanta?: { x: number; y: number };
}

export interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  autorId: string;
  turmaId?: string;
  dataPublicacao: string;
  fixado: boolean;
}
