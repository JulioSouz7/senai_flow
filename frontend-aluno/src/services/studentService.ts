import { api, withToken } from "@/lib/api";
import type {
  AreaRisco,
  Comunicado,
  CriarRelatoResponse,
  DetalheTurmaResponse,
  Faq,
  MinhaTurmaResponse,
  Predio,
  RankingSala,
} from "@/lib/types";

export const studentService = {
  async minhaTurma(token: string) {
    const { data } = await api.get<MinhaTurmaResponse>(
      "/comunicados/minha-turma",
      withToken(token),
    );
    if (!data.turma?.id_turma) return { ...data, docentes: [] };

    const turmaResponse = await api.get<DetalheTurmaResponse>(
      `/turmas/${data.turma.id_turma}`,
      withToken(token),
    );
    const docentes = (turmaResponse.data.docente_turma || []).flatMap(({ docente }) =>
      docente?.usuario?.nome
        ? [{ id_docente: docente.id_docente, nome: docente.usuario.nome }]
        : [],
    );

    return { ...data, docentes };
  },

  async comunicados(token: string) {
    const { data } = await api.get<Comunicado[]>("/comunicados", withToken(token));
    return data;
  },

  async ranking(token: string) {
    const { data } = await api.get<RankingSala[]>("/pontuacoes/ranking", withToken(token));
    return data;
  },

  async predios(token: string) {
    const { data } = await api.get<Predio[]>("/predios", withToken(token));
    return data;
  },

  async areasRisco(token: string, id_predio?: number) {
    const { data } = await api.get<AreaRisco[]>("/areas-risco", {
      ...withToken(token),
      params: id_predio ? { id_predio } : undefined,
    });
    return data;
  },

  async faqs(token: string) {
    const { data } = await api.get<Faq[]>("/faqs", withToken(token));
    return data;
  },

  async criarRelato(token: string, tipo: "SUGESTAO" | "RECLAMACAO", descricao: string) {
    const { data } = await api.post<CriarRelatoResponse>(
      "/relatos-sugestoes",
      { tipo, descricao },
      withToken(token),
    );
    return data;
  },

  async abrirChamado(token: string, assunto: string, descricao: string) {
    const { data } = await api.post(
      "/chamados",
      { assunto, descricao },
      withToken(token),
    );
    return data;
  },
};