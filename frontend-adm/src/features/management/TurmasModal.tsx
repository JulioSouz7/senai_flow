import { useState, useEffect, FormEvent } from "react";
import { Icon } from "../../components/icons/Icon";
import { api } from "../../services/api";

interface Turma {
  id_turma: number;
  nome: string;
  curso: string;
  carga_horaria_semanal?: number;
  qtd_alunos?: number;
  docentes?: any[];
}

interface TurmasModalProps {
  isOpen: boolean;
  onClose: () => void;
  notify?: (msg: string) => void;
}

// Fallback apenas para preencher o select caso a rota GET /docentes falhe
const docentesFallback = [
  { id_docente: 1, id_usuario: 2,  nif: "DOC-0001", nome: "Docente DOC-0001" },
  { id_docente: 2, id_usuario: 3,  nif: "DOC-0002", nome: "Docente DOC-0002" },
  { id_docente: 3, id_usuario: 9,  nif: "NIF-019",   nome: "Docente NIF-019" },
  { id_docente: 6, id_usuario: 26, nif: "DOC-8239", nome: "Docente DOC-8239" },
];

export function TurmasModal({ isOpen, onClose, notify }: TurmasModalProps) {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [docentes, setDocentes] = useState<any[]>(docentesFallback);
  const [loading, setLoading] = useState(false);
  const [loadingDocentes, setLoadingDocentes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modais internos
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Modal de Detalhes da Turma
  const [detailsTurma, setDetailsTurma] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form Turma
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [curso, setCurso] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState<string>("20");
  const [qtdAlunos, setQtdAlunos] = useState<string>("20");
  const [submitting, setSubmitting] = useState(false);

  // Form Vinculação
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [selectedDocenteId, setSelectedDocenteId] = useState("");

  // GET /turmas
  const fetchTurmas = async () => {
    try {
      setLoading(true);
      const res = await api.get("/turmas");
      const list = Array.isArray(res.data)
        ? res.data
        : res.data?.turmas || res.data?.data || [];
      setTurmas(list);
    } catch (error) {
      console.error("Erro ao listar turmas:", error);
      if (notify) notify("Erro ao carregar a lista de turmas.");
    } finally {
      setLoading(false);
    }
  };

  // GET /docentes
  const fetchDocentes = async () => {
    try {
      setLoadingDocentes(true);
      let res: any;

      try {
        res = await api.get("/docentes");
      } catch (err) {
        res = await api.get("/docente");
      }

      let dataList: any[] = [];
      if (Array.isArray(res.data)) {
        dataList = res.data;
      } else if (Array.isArray(res.data?.docentes)) {
        dataList = res.data.docentes;
      } else if (Array.isArray(res.data?.data)) {
        dataList = res.data.data;
      }

      if (dataList.length > 0) {
        setDocentes(dataList);
      } else {
        setDocentes(docentesFallback);
      }
    } catch (error) {
      console.error("Erro ao buscar docentes:", error);
      setDocentes(docentesFallback);
    } finally {
      setLoadingDocentes(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTurmas();
      fetchDocentes();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isLinkOpen) {
      fetchDocentes();
    }
  }, [isLinkOpen]);

  if (!isOpen) return null;

  // Abrir Detalhes da Turma (GET /turmas/:id)
  const handleOpenDetails = async (turma: Turma) => {
    setDetailsTurma(turma);
    setLoadingDetails(true);

    try {
      const res = await api.get(`/turmas/${turma.id_turma}`);
      if (res.data) {
        setDetailsTurma(res.data);
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da turma:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setNome("");
    setCurso("");
    setCargaHoraria("20");
    setQtdAlunos("20");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Turma) => {
    setEditingId(t.id_turma);
    setNome(t.nome || "");
    setCurso(t.curso || "");
    setCargaHoraria(String(t.carga_horaria_semanal || 20));
    setQtdAlunos(String(t.qtd_alunos || 0));
    setIsFormOpen(true);
  };

  const handleSubmitTurma = async (e: FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !curso.trim() || !cargaHoraria) {
      if (notify) notify("Preencha Nome, Curso e Carga Horária.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        nome: nome.trim(),
        curso: curso.trim(),
        carga_horaria_semanal: Number(cargaHoraria),
        qtd_alunos: Number(qtdAlunos) || 0,
      };

      if (editingId) {
        await api.put(`/turmas/${editingId}`, payload);
        if (notify) notify("Turma atualizada com sucesso!");
      } else {
        await api.post("/turmas", payload);
        if (notify) notify("Turma cadastrada com sucesso!");
      }

      setIsFormOpen(false);
      fetchTurmas();
    } catch (error: any) {
      console.error("Erro ao salvar turma:", error);
      const msg = error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao salvar turma.";
      if (notify) notify(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await api.delete(`/turmas/${deleteConfirmId}`);
      if (notify) notify("Turma removida com sucesso!");
      setTurmas((prev) => prev.filter((t) => t.id_turma !== deleteConfirmId));
    } catch (error: any) {
      console.error("Erro ao excluir turma:", error);
      const msg = error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao excluir turma.";
      if (notify) notify(msg);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // POST /turmas/vincular-docente
  const handleLinkDocente = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTurma || !selectedDocenteId) {
      if (notify) notify("Selecione um docente.");
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        id_turma: Number(selectedTurma.id_turma),
        id_docente: Number(selectedDocenteId),
      };

      await api.post("/turmas/vincular-docente", payload);

      if (notify) notify("Docente vinculado com sucesso!");
      setIsLinkOpen(false);
      fetchTurmas();
    } catch (error: any) {
      console.error("Erro ao vincular docente:", error);
      const msg = error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao vincular docente.";
      if (notify) notify(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const turmasFiltradas = (turmas || []).filter((t) => {
    const term = searchTerm.toLowerCase();
    const nomeTurma = (t.nome || "").toLowerCase();
    const cursoTurma = (t.curso || "").toLowerCase();
    return nomeTurma.includes(term) || cursoTurma.includes(term) || String(t.id_turma).includes(term);
  });

  return (
    <div style={overlayStyle}>
      <div className="panel" style={{ width: "100%", maxWidth: "840px", maxHeight: "90vh", overflowY: "auto", padding: "24px", borderRadius: "12px", background: "#fff" }}>
        
        {/* Cabeçalho */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#0f172a" }}>Gestão de Turmas e Docentes</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Cadastre, edite, consulte detalhes e vincule docentes às turmas.</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#64748b" }}>✕</button>
        </div>

        {/* Pesquisa e Botão Cadastrar */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Pesquisar por nome, ID ou curso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: "220px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
          <button className="primary-btn" onClick={handleOpenCreate} style={{ padding: "8px 16px" }}>
            + Cadastrar Turma
          </button>
        </div>

        {/* Lista de Turmas */}
        {loading ? (
          <p style={{ textAlign: "center", color: "#64748b", padding: "20px 0" }}>Carregando turmas...</p>
        ) : turmasFiltradas.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {turmasFiltradas.map((t) => (
              <div key={t.id_turma} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div>
                  <b style={{ fontSize: "14px", color: "#0f172a" }}>{t.nome}</b>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    Curso: {t.curso} • {t.carga_horaria_semanal || 0}h/semana • {t.qtd_alunos || 0} Alunos
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(t)}
                    style={{ backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", color: "#334155", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Detalhes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTurma(t);
                      setSelectedDocenteId("");
                      setIsLinkOpen(true);
                    }}
                    style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Vincular Docente
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(t)}
                    style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(t.id_turma)}
                    style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>Nenhuma turma encontrada.</p>
        )}

        {/* Modal de Detalhes da Turma */}
        {detailsTurma && (() => {
          let listDocentesVinculados: any[] = [];
          
          if (Array.isArray(detailsTurma.docentes) && detailsTurma.docentes.length > 0) {
            listDocentesVinculados = detailsTurma.docentes;
          } else if (Array.isArray(detailsTurma.docente_turma) && detailsTurma.docente_turma.length > 0) {
            listDocentesVinculados = detailsTurma.docente_turma.map((dt: any) => dt.docente || dt);
          }

          return (
            <div style={{ ...overlayStyle, zIndex: 1100 }}>
              <div className="panel" style={{ width: "100%", maxWidth: "520px", padding: "24px", background: "#fff", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                      Informações da Turma: {detailsTurma.nome}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsTurma(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}
                  >
                    ✕
                  </button>
                </div>

                {loadingDetails ? (
                  <p style={{ textAlign: "center", color: "#64748b", padding: "20px 0" }}>Carregando dados da turma...</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {/* Grid de Informações da Turma */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <div>
                        <small style={{ color: "#64748b", fontSize: "11px", display: "block" }}>CURSO</small>
                        <strong style={{ fontSize: "13px", color: "#0f172a" }}>{detailsTurma.curso || "Não informado"}</strong>
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: "11px", display: "block" }}>CARGA HORÁRIA</small>
                        <strong style={{ fontSize: "13px", color: "#0f172a" }}>{detailsTurma.carga_horaria_semanal || 0}h / semana</strong>
                      </div>

                      <div>
                        <small style={{ color: "#64748b", fontSize: "11px", display: "block" }}>QUANTIDADE DE ALUNOS</small>
                        <strong style={{ fontSize: "13px", color: "#0f172a" }}>{detailsTurma.qtd_alunos || 0} alunos</strong>
                      </div>
                    </div>

                    {/* Seção de Docentes Vinculados */}
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", margin: "10px 0 8px 0" }}>
                        Docentes Vinculados
                      </h4>

                      {listDocentesVinculados.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {listDocentesVinculados.map((doc: any, idx: number) => {
                            const idDoc = doc.id_docente || doc.id || doc.id_usuario;
                            const nomeDocente =
                              doc.usuario?.nome ||
                              doc.nome ||
                              doc.nome_docente ||
                              (doc.nif ? `Docente (${doc.nif})` : `Docente #${idDoc}`);

                            return (
                              <div
                                key={idDoc || idx}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "8px 12px",
                                  backgroundColor: "#eff6ff",
                                  borderRadius: "6px",
                                  border: "1px solid #bfdbfe",
                                  fontSize: "13px",
                                }}
                              >
                                <span style={{ fontWeight: 600, color: "#1e3a8a" }}>{nomeDocente}</span>
                                <span style={{ fontSize: "11px", color: "#3b82f6" }}>ID Docente: #{idDoc}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic", margin: 0, padding: "8px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
                          Nenhum docente vinculado a esta turma no momento.
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() => setDetailsTurma(null)}
                        style={{ padding: "8px 16px" }}
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Modal de Formulário Turma */}
        {isFormOpen && (
          <div style={{ ...overlayStyle, zIndex: 1100 }}>
            <form onSubmit={handleSubmitTurma} className="panel" style={{ width: "100%", maxWidth: "460px", padding: "20px", background: "#fff", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 14px 0" }}>
                {editingId ? `Editar Turma #${editingId}` : "Cadastrar Turma"}
              </h3>
              
              <label style={{ display: "block", marginBottom: "10px", fontSize: "13px" }}>
                Nome da Turma / Código:*
                <input
                  required
                  placeholder="Ex: DS3A"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </label>

              <label style={{ display: "block", marginBottom: "10px", fontSize: "13px" }}>
                Curso:*
                <input
                  required
                  placeholder="Ex: Técnico em Desenvolvimento de Sistemas"
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px" }}>
                  Carga Horária (h/sem):*
                  <input
                    type="number"
                    required
                    min={1}
                    value={cargaHoraria}
                    onChange={(e) => setCargaHoraria(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </label>

                <label style={{ display: "block", fontSize: "13px" }}>
                  Qtd. de Alunos:
                  <input
                    type="number"
                    min={0}
                    value={qtdAlunos}
                    onChange={(e) => setQtdAlunos(e.target.value)}
                    style={{ width: "100%", padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                  />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" className="secondary-btn" onClick={() => setIsFormOpen(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal de Vinculação de Docente */}
        {isLinkOpen && selectedTurma && (
          <div style={{ ...overlayStyle, zIndex: 1100 }}>
            <form onSubmit={handleLinkDocente} className="panel" style={{ width: "100%", maxWidth: "420px", padding: "20px", background: "#fff", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 10px 0" }}>Vincular Docente</h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px" }}>Turma: <b>{selectedTurma.nome}</b></p>
              
              <label style={{ display: "block", marginBottom: "16px", fontSize: "13px" }}>
                Docente:
                <select
                  required
                  value={selectedDocenteId}
                  onChange={(e) => setSelectedDocenteId(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                >
                  <option value="">
                    {loadingDocentes ? "Carregando docentes..." : "Selecione..."}
                  </option>

                  {docentes.map((d: any) => {
                    const idDocente = d.id_docente || d.id;
                    const nomeDocente =
                      d.usuario?.nome ||
                      d.nome ||
                      d.nome_docente ||
                      (d.nif ? `Docente (${d.nif})` : `Docente #${idDocente}`);

                    return (
                      <option key={idDocente} value={idDocente}>
                        {nomeDocente} (ID Docente: #{idDocente})
                      </option>
                    );
                  })}
                </select>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <button type="button" className="secondary-btn" onClick={() => setIsLinkOpen(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="primary-btn" disabled={submitting}>
                  {submitting ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {deleteConfirmId && (
          <div style={{ ...overlayStyle, zIndex: 1100 }}>
            <div className="panel" style={{ width: "100%", maxWidth: "360px", padding: "20px", background: "#fff", borderRadius: "10px", textAlign: "center" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0" }}>Excluir Turma?</h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>Deseja remover permanentemente a turma #{deleteConfirmId}?</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" className="secondary-btn" onClick={() => setDeleteConfirmId(null)} style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="button" onClick={handleExecuteDelete} style={{ flex: 1, backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer", padding: "8px" }}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
};