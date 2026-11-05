import { apiRequest } from "@/lib/api";
import type { AreaRisco, Comunicado, Faq, MinhaTurma, Predio, RankingSala, Relato } from "@/lib/types";

interface TurmaDetail {
  docente_turma?: { docente?: { id_docente: number; usuario?: { nome: string } } }[];
}

export const studentService = {
  async minhaTurma(token: string) {
    const result = await apiRequest<MinhaTurma>("/comunicados/minha-turma", { token });
    if (!result.turma?.id_turma) return { ...result, docentes: [] };
    const detail = await apiRequest<TurmaDetail>(`/turmas/${result.turma.id_turma}`, { token });
    return {
      ...result,
      docentes: (detail.docente_turma || []).flatMap(({ docente }) =>
        docente?.usuario?.nome ? [{ id_docente: docente.id_docente, nome: docente.usuario.nome }] : [],
      ),
    };
  },

  comunicados(token: string) {
    return apiRequest<Comunicado[]>("/comunicados", { token });
  },

  ranking(token: string) {
    return apiRequest<RankingSala[]>("/pontuacoes/ranking", { token });
  },

  predios(token: string) {
    return apiRequest<Predio[]>("/predios", { token });
  },

  areasRisco(token: string) {
    return apiRequest<AreaRisco[]>("/areas-risco", { token });
  },

  faqs(token: string) {
    return apiRequest<Faq[]>("/faqs", { token });
  },

  criarRelato(token: string, tipo: "SUGESTAO" | "RECLAMACAO", descricao: string) {
    return apiRequest<{ message: string; relato: Relato }>("/relatos-sugestoes", {
      method: "POST",
      token,
      body: { tipo, descricao },
    });
  },

  abrirChamado(token: string, assunto: string, descricao: string) {
    return apiRequest("/chamados", { method: "POST", token, body: { assunto, descricao } });
  },
};