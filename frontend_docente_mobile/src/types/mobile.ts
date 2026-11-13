export type AppRole =  'teacher';

export interface AuthenticatedUser {
  id?: string | number;
  nome?: string;
  email?: string;
  perfil?: string;
  role?: string;
  id_turma?: number | string;
  turmaId?: number | string;
  senha_alterada?: boolean;
  [key: string]: unknown;
}

export interface MobileSession {
  token: string;
  user: AuthenticatedUser;
  role: AppRole;
  mustChangePassword?: boolean;
}

export interface LoginResponse {
  token: string;
  usuario: AuthenticatedUser;
  requer_troca_senha: boolean;
  message?: string;
}

export interface ApiRecord {
  id?: string | number;
  id_sala?: number;
  id_sala_horario?: number;
  id_predio?: number;
  nome?: string;
  nome_sala?: string;
  nome_predio?: string;
  capacidade?: number;
  foto?: string | null;
  predio?: { nome?: string };
  horarios_disponiveis?: ApiRecord[];
  ativo?: boolean;
  dia_semana?: number;
  hora_inicio?: string;
  hora_fim?: string;
  horario?: { hora_inicio?: string; hora_fim?: string };
  [key: string]: unknown;
}

export interface WorkspaceItem {
  id: string;
  label: string;
  title: string;
  description: string;
  endpoint?: string | string[];
}
