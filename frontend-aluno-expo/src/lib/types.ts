export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: string;
  aluno?: {
    id_aluno: number;
    matricula: string;
    situacao: string;
    id_turma: number;
    turma?: { id_turma: number; nome: string; curso: string };
  } | null;
}

export interface AuthSession {
  token: string;
  usuario: Usuario;
}

export interface LoginResponse extends AuthSession {
  requer_troca_senha: boolean;
  message: string;
}

export interface Comunicado {
  id_comunicado: number;
  titulo: string;
  conteudo: string;
  abrangencia: string;
  dt_publicacao: string;
  administrador?: { usuario?: { nome: string } };
}

export interface MinhaTurma {
  turma: { id_turma: number; nome: string; curso: string } | null;
  comunicados: Comunicado[];
  docentes?: { id_docente: number; nome: string }[];
}

export interface RankingSala {
  posicao: number;
  id_sala: number;
  nome_sala: string;
  predio: string;
  total_pontos: number;
  total_avaliacoes: number;
  semestre_letivo: string;
}

export interface Predio {
  id_predio: number;
  nome: string;
}

export interface AreaRisco {
  id_area: number;
  id_predio: number;
  nome: string;
  tipo: string;
  orientacao_seguranca: string;
  andar: number;
  imagem_url?: string | null;
  predio?: Predio;
}

export interface Faq {
  id_faq: number;
  pergunta: string;
  resposta: string;
  categoria?: string | null;
}

export interface Relato {
  id_relato: number;
  tipo: "RECLAMACAO" | "SUGESTAO";
  descricao: string;
  dt_envio: string;
  prazo_resposta?: string | null;
  status: string;
  resposta?: string | null;
}