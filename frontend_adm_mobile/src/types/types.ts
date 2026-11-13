export type Role = 'management' | 'teacher' | 'student';

export interface UsuarioLogado {
  id_usuario?: number;
  nome: string;
  email: string;
  perfil: string;
  senha_alterada?: boolean;
  id_adm?: number;
  id_docente?: number;
  id_aluno?: number;
}