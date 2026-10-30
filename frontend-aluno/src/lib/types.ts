export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: string;
  senha_alterada?: boolean;
  aluno?: {
    id_aluno: number;
    matricula: string;
    situacao: string;
    id_turma: number;
    turma?: Turma;
  } | null;
}

export interface AuthSession {
  token: string;
  usuario: Usuario;
}

export interface AuthResponse extends AuthSession {
  requer_troca_senha: boolean;
  message: string;
}

export interface Turma {
  id_turma: number;
  nome: string;
  curso: string;
  qtd_alunos?: number;
}

export interface Comunicado {
  id_comunicado: number;
  titulo: string;
  conteudo: string;
  abrangencia: string;
  dt_publicacao: string;
  turma?: Turma | null;
  administrador?: { usuario?: { nome: string } };
}

export interface MinhaTurmaResponse {
  turma: Turma | null;
  comunicados: Comunicado[];
  docentes?: { id_docente: number; nome: string }[];
}

export interface DetalheTurmaResponse extends Turma {
  docente_turma?: {
    docente?: {
      id_docente: number;
      usuario?: { nome: string };
    };
  }[];
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
  predio?: Pick<Predio, "id_predio" | "nome">;
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

export interface CriarRelatoResponse {
  message: string;
  relato: Relato;
}