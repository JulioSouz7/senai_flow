import { apiRequest } from "@/lib/api";
import type { AreaRisco, ChamadoSuporte, Comunicado, Faq, MinhaTurma, Predio, RankingSala, Relato, Sala } from "@/lib/types";

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

  async ranking(token: string) {
    const [ranking, salas] = await Promise.all([
      apiRequest<RankingSala[]>("/pontuacoes/ranking", { token }),
      apiRequest<Sala[]>("/salas", { token }),
    ]);
    const fotosPorSala = new Map(salas.map((sala) => [sala.id_sala, sala.foto]));
    const salasForaDaListaAtiva = ranking.filter(
      (item) => !fotosPorSala.has(item.id_sala) && item.nome_sala !== "Sala Removida",
    );
    const detalhesForaDaLista = await Promise.all(
      salasForaDaListaAtiva.map((item) => apiRequest<Sala>(`/salas/${item.id_sala}`, { token })),
    );
    detalhesForaDaLista.forEach((sala) => fotosPorSala.set(sala.id_sala, sala.foto));
    return ranking.map((item) => ({ ...item, foto: fotosPorSala.get(item.id_sala) ?? null }));
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

  relatosDoUsuario(token: string, id_usuario: number) {
    return apiRequest<Relato[]>(`/relatos-sugestoes/usuario/${id_usuario}`, { token });
  },

  abrirChamado(token: string, assunto: string, descricao: string) {
    return apiRequest("/chamados", { method: "POST", token, body: { assunto, descricao } });
  },

  chamadosDoAluno(token: string, id_aluno: number) {
    return apiRequest<ChamadoSuporte[]>(`/chamados/aluno/${id_aluno}`, { token });
  },
};