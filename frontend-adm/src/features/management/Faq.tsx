import { useState, useEffect, FormEvent } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { Icon } from "../../components/icons/Icon";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";

interface FAQ {
  id_faq: number;
  pergunta: string;
  resposta: string;
  categoria: string | null;
}

interface ChamadoItem {
  id_chamado: number;
  id_usuario: number;
  id_admin_resp?: number | null;
  assunto: string;
  descricao: string;
  status: string;
  resposta?: string | null;
  created_at?: string;
  usuario?: {
    nome?: string;
    email?: string;
  };
}

export function Faq({ notify, role }: { notify: (msg: string) => void; role?: string }) {
  const isAdmin = true;

  // Controle de Abas ('faq' | 'chamados')
  const [activeTab, setActiveTab] = useState<"faq" | "chamados">("faq");

  // ESTADOS DE FAQ
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  // Filtros de FAQ
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Modal / Edição de FAQ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [categoria, setCategoria] = useState("Geral");
  const [submitting, setSubmitting] = useState(false);

  // Modal de Confirmação de Exclusão de FAQ
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // ESTADOS DE CHAMADOS DE SUPORTE
  const [chamados, setChamados] = useState<ChamadoItem[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(false);
  const [filterStatus, setFilterStatus] = useState("TODOS");

  // Modal de Detalhes Completos do Chamado
  const [viewChamadoDetails, setViewChamadoDetails] = useState<ChamadoItem | null>(null);

  // Modal de Responder Chamado / Alterar Status
  const [selectedChamado, setSelectedChamado] = useState<ChamadoItem | null>(null);
  const [respostaTexto, setRespostaTexto] = useState("");
  const [novoStatus, setNovoStatus] = useState("RESOLVIDO");
  const [submittingResposta, setSubmittingResposta] = useState(false);

  // Carrega as FAQs chamando a API do backend
  const fetchFaqs = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("busca", searchTerm.trim());
      if (selectedCategory) params.append("categoria", selectedCategory);

      const response = await api.get(`/faqs?${params.toString()}`);
      setFaqs(Array.isArray(response.data) ? response.data : []);
      if (manual) notify("Perguntas frequentes atualizadas.");
    } catch (error: any) {
      console.error("Erro ao buscar FAQs:", error);
      notify("Erro ao carregar as perguntas frequentes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Carrega os Chamados de Suporte do backend
  const fetchChamados = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      setLoadingChamados(true);
      let res;
      try {
        res = await api.get("/chamados-suporte");
      } catch {
        try {
          res = await api.get("/chamados");
        } catch {
          res = await api.get("/suporte");
        }
      }

      if (res && Array.isArray(res.data)) {
        setChamados(res.data);
        if (manual) notify("Chamados de suporte atualizados.");
      }
    } catch (error) {
      console.error("Erro ao buscar chamados de suporte:", error);
      if (manual) notify("Erro ao atualizar os chamados de suporte.");
    } finally {
      setLoadingChamados(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchChamados();
  }, []);

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setPergunta("");
    setResposta("");
    setCategoria("Geral");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (faq: FAQ, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(faq.id_faq);
    setPergunta(faq.pergunta);
    setResposta(faq.resposta);
    setCategoria(faq.categoria || "Geral");
    setIsModalOpen(true);
  };

  const handleOpenDeleteConfirm = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await api.delete(`/faqs/${deleteConfirmId}`);
      notify("Pergunta removida com sucesso!");
      setFaqs((prev) => prev.filter((f) => f.id_faq !== deleteConfirmId));
    } catch (error: any) {
      console.error("Erro ao deletar FAQ:", error);
      notify(error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao excluir FAQ.");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pergunta.trim() || !resposta.trim()) {
      return notify("Preencha a pergunta e a resposta.");
    }

    try {
      setSubmitting(true);
      const payload = {
        pergunta: pergunta.trim(),
        resposta: resposta.trim(),
        categoria: categoria.trim() || undefined,
      };

      if (editingId) {
        await api.put(`/faqs/${editingId}`, payload);
        notify("FAQ atualizada com sucesso!");
      } else {
        await api.post("/faqs", payload);
        notify("FAQ criada com sucesso!");
      }

      setIsModalOpen(false);
      fetchFaqs();
    } catch (error: any) {
      console.error("Erro ao salvar FAQ:", error);
      const msg = error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao salvar FAQ.";
      notify(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ENVIO DE RESPOSTA E ALTERAÇÃO DE STATUS CONECTADO À ROTA PATCH DO BACKEND
  const handleEnviarResposta = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedChamado) return;

    const idChamado = selectedChamado.id_chamado;

    try {
      setSubmittingResposta(true);

      // Garante envio do cabeçalho de Autenticação JWT
      const token = localStorage.getItem("@senaiflow:token") || localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let res = null;
      let lastErrorMessage = "";

      // Rotas registradas em chamadoSuporteRoutes.ts (PATCH /:id/status)
      const routesToTry = [
        `/chamados-suporte/${idChamado}/status`,
        `/chamados/${idChamado}/status`,
        `/suporte/${idChamado}/status`,
      ];

      for (const route of routesToTry) {
        try {
          res = await api.patch(route, { status: novoStatus }, { headers });
          if (res) break;
        } catch (err: any) {
          console.warn(`Tentativa em ${route} falhou:`, err?.response?.data || err.message);
          const msg =
            err?.response?.data?.mensagem ||
            err?.response?.data?.message ||
            err?.response?.data?.error;
          if (msg) lastErrorMessage = msg;
        }
      }

      if (res && res.data) {
        notify(`Chamado #${idChamado} atualizado com sucesso!`);

        setChamados((prev) =>
          prev.map((c) =>
            c.id_chamado === idChamado
              ? { ...c, status: novoStatus, resposta: respostaTexto.trim() }
              : c
          )
        );

        setSelectedChamado(null);
        fetchChamados();
      } else {
        notify(
          lastErrorMessage
            ? `Erro: ${lastErrorMessage}`
            : "Erro ao alterar status. Verifique se o seu usuário possui vínculo na tabela ADMINISTRADOR."
        );
      }
    } catch (error: any) {
      console.error("Erro ao atualizar chamado:", error);
      notify("Erro de comunicação com o servidor.");
    } finally {
      setSubmittingResposta(false);
    }
  };

  const chamadosPendentes = chamados.filter(
    (c) => c.status !== "RESOLVIDO" && c.status !== "CONCLUIDO"
  ).length;

  const chamadosFiltrados = chamados.filter((c) => {
    if (filterStatus === "TODOS") return true;
    return c.status === filterStatus;
  });

  return (
    <>
      <PageTitle
        eyebrow="CENTRAL DE AJUDA"
        title="FAQ & Suporte"
        text="Tire dúvidas sobre a plataforma e gerencie chamados de suporte dos usuários."
        action={<RefreshButton refreshing={refreshing} onRefresh={() => void (activeTab === "faq" ? fetchFaqs(true) : fetchChamados(true))} />}
      />

      {/* NAVEGAÇÃO POR ABAS */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("faq")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "faq" ? "3px solid #dc2626" : "3px solid transparent",
            color: activeTab === "faq" ? "#dc2626" : "#64748b",
            fontWeight: activeTab === "faq" ? 700 : 500,
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "-2px",
          }}
        >
          Perguntas Frequentes (FAQ)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chamados")}
          style={{
            padding: "10px 16px",
            border: "none",
            background: "none",
            borderBottom: activeTab === "chamados" ? "3px solid #dc2626" : "3px solid transparent",
            color: activeTab === "chamados" ? "#dc2626" : "#64748b",
            fontWeight: activeTab === "chamados" ? 700 : 500,
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "-2px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Chamados de Suporte
          {chamadosPendentes > 0 && (
            <span
              style={{
                backgroundColor: "#dc2626",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
                borderRadius: "10px",
                padding: "2px 7px",
              }}
            >
              {chamadosPendentes}
            </span>
          )}
        </button>
      </div>

      {/* ABA 1: PERGUNTAS FREQUENTES (FAQ) */}
      {activeTab === "faq" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Barra Superior */}
          <div
            className="panel"
            style={{
              padding: "16px 24px",
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "280px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  placeholder="Pesquisar por dúvida ou resposta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px 10px 36px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    backgroundColor: "#f8fafc",
                    outline: "none",
                    color: "#1e293b",
                  }}
                />
                <span style={{ position: "absolute", left: "12px", top: "10px", color: "#94a3b8" }}>
                  <Icon name="search" size={16} />
                </span>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  backgroundColor: "#f8fafc",
                  color: "#1e293b",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Todas as categorias</option>
                <option value="Reservas">Reservas</option>
                <option value="Equipamentos">Equipamentos</option>
                <option value="Acesso">Acesso & Conta</option>
                <option value="Geral">Geral</option>
              </select>
            </div>

            {isAdmin && (
              <button className="primary-btn" onClick={handleOpenCreateModal} style={{ padding: "10px 18px" }}>
                + Nova Pergunta
              </button>
            )}
          </div>

          {/* Lista Accordion */}
          <div className="panel" style={{ padding: "12px 24px" }}>
            {loading ? (
              <p style={{ padding: "20px 0", textAlign: "center", color: "#64748b" }}>
                Carregando perguntas frequentes...
              </p>
            ) : faqs.length > 0 ? (
              faqs.map((faq) => {
                const isOpen = openId === faq.id_faq;
                return (
                  <div
                    key={faq.id_faq}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      padding: "16px 0",
                    }}
                  >
                    <div
                      onClick={() => toggleAccordion(faq.id_faq)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                            color: "#64748b",
                            display: "inline-block",
                          }}
                        >
                          ▶
                        </span>
                        <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                          {faq.pergunta}
                        </h3>
                        {faq.categoria && (
                          <span
                            style={{
                              fontSize: "11px",
                              backgroundColor: "#f1f5f9",
                              color: "#475569",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: 500,
                            }}
                          >
                            {faq.categoria}
                          </span>
                        )}
                      </div>

                      {isAdmin && (
                        <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditModal(faq, e)}
                            style={{
                              backgroundColor: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              color: "#16a34a",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleOpenDeleteConfirm(faq.id_faq, e)}
                            style={{
                              backgroundColor: "#fef2f2",
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>

                    {isOpen && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px 16px 12px 28px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "8px",
                          color: "#334155",
                          fontSize: "14px",
                          lineHeight: "1.6",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {faq.resposta}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8" }}>
                Nenhuma pergunta encontrada para os filtros aplicados.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: CHAMADOS DE SUPORTE */}
      {activeTab === "chamados" && (
        <div>
          {/* FILTRO DE STATUS */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>Filtrar Status:</span>
            {["TODOS", "ABERTO", "EM_ANDAMENTO", "RESOLVIDO"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: filterStatus === st ? "#dc2626" : "#cbd5e1",
                  backgroundColor: filterStatus === st ? "#fee2e2" : "#fff",
                  color: filterStatus === st ? "#dc2626" : "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* TABELA DE CHAMADOS DE SUPORTE */}
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            {loadingChamados ? (
              <p style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>Carregando chamados...</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                    <th style={{ padding: "12px 16px" }}>ID</th>
                    <th style={{ padding: "12px 16px" }}>Usuário</th>
                    <th style={{ padding: "12px 16px" }}>Assunto</th>
                    <th style={{ padding: "12px 16px" }}>Descrição</th>
                    <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {chamadosFiltrados.length > 0 ? (
                    chamadosFiltrados.map((item) => {
                      const isResolvido = item.status === "RESOLVIDO" || item.status === "CONCLUIDO";
                      const isEmAndamento = item.status === "EM_ANDAMENTO";

                      return (
                        <tr
                          key={item.id_chamado}
                          onClick={() => setViewChamadoDetails(item)}
                          style={{
                            borderBottom: "1px solid #f1f5f9",
                            cursor: "pointer",
                            transition: "background-color 0.15s ease",
                          }}
                        >
                          <td style={{ padding: "12px 16px", fontWeight: 700, color: "#64748b" }}>
                            #{item.id_chamado}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>
                            {item.usuario?.nome || `Usuário #${item.id_usuario}`}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                            {item.assunto}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "#475569",
                              maxWidth: "280px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.descricao}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "center" }}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 700,
                                backgroundColor: isResolvido ? "#d1fae5" : isEmAndamento ? "#fef3c7" : "#fee2e2",
                                color: isResolvido ? "#065f46" : isEmAndamento ? "#92400e" : "#991b1b",
                              }}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setViewChamadoDetails(item)}
                                style={{
                                  backgroundColor: "#f1f5f9",
                                  border: "1px solid #cbd5e1",
                                  color: "#334155",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Detalhes
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedChamado(item);
                                  setRespostaTexto(item.resposta || "");
                                  setNovoStatus(item.status === "ABERTO" ? "EM_ANDAMENTO" : item.status === "CONCLUIDO" ? "RESOLVIDO" : item.status);
                                }}
                                style={{
                                  backgroundColor: "#eff6ff",
                                  border: "1px solid #bfdbfe",
                                  color: "#2563eb",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Responder
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
                        Nenhum chamado de suporte encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: VER DETALHES COMPLETOS DO CHAMADO */}
      {viewChamadoDetails && (
        <div style={modalOverlayStyle}>
          <div
            className="panel"
            style={{ ...modalContentStyle, maxWidth: "560px", padding: "24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                  Detalhes do Chamado #{viewChamadoDetails.id_chamado}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Solicitante: <b>{viewChamadoDetails.usuario?.nome || `Usuário #${viewChamadoDetails.id_usuario}`}</b> (ID Usuário: {viewChamadoDetails.id_usuario})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewChamadoDetails(null)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* BADGES E STATUS */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px", alignItems: "center" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 700,
                  backgroundColor:
                    viewChamadoDetails.status === "RESOLVIDO" || viewChamadoDetails.status === "CONCLUIDO"
                      ? "#d1fae5"
                      : viewChamadoDetails.status === "EM_ANDAMENTO"
                      ? "#fef3c7"
                      : "#fee2e2",
                  color:
                    viewChamadoDetails.status === "RESOLVIDO" || viewChamadoDetails.status === "CONCLUIDO"
                      ? "#065f46"
                      : viewChamadoDetails.status === "EM_ANDAMENTO"
                      ? "#92400e"
                      : "#991b1b",
                }}
              >
                Status: {viewChamadoDetails.status}
              </span>

              {viewChamadoDetails.id_admin_resp && (
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Admin Responsável: <b>#{viewChamadoDetails.id_admin_resp}</b>
                </span>
              )}
            </div>

            {/* ASSUNTO E DESCRIÇÃO COMPLETA */}
            <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <b style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>ASSUNTO:</b>
              <p style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                {viewChamadoDetails.assunto}
              </p>

              <b style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>DESCRIÇÃO COMPLETA DO PROBLEMA:</b>
              <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {viewChamadoDetails.descricao}
              </p>
            </div>

            {/* RESPOSTA REGISTRADA */}
            {viewChamadoDetails.resposta && (
              <div style={{ background: "#f0fdf4", padding: "14px", borderRadius: "8px", border: "1px solid #bbf7d0", marginBottom: "16px" }}>
                <b style={{ fontSize: "12px", color: "#166534", display: "block", marginBottom: "4px" }}>RESPOSTA REGISTRADA:</b>
                <p style={{ margin: 0, fontSize: "13px", color: "#14532d", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {viewChamadoDetails.resposta}
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setViewChamadoDetails(null)}
              >
                Fechar
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  const target = viewChamadoDetails;
                  setViewChamadoDetails(null);
                  setSelectedChamado(target);
                  setRespostaTexto(target.resposta || "");
                  setNovoStatus(target.status === "ABERTO" ? "EM_ANDAMENTO" : target.status === "CONCLUIDO" ? "RESOLVIDO" : target.status);
                }}
              >
                Responder / Alterar Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESPONDER CHAMADO E ALTERAR STATUS */}
      {selectedChamado && (
        <div style={modalOverlayStyle}>
          <div
            className="panel"
            style={{ ...modalContentStyle, maxWidth: "540px", padding: "24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                Responder Chamado #{selectedChamado.id_chamado}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedChamado(null)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* RELATO DO USUÁRIO */}
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
              <div style={{ marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>ASSUNTO:</span>
                <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>
                  {selectedChamado.assunto}
                </p>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>DESCRIÇÃO:</span>
                <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#334155" }}>
                  {selectedChamado.descricao}
                </p>
              </div>
            </div>

            {/* FORMULÁRIO DE RESPOSTA E ALTERAÇÃO DE STATUS */}
            <form onSubmit={handleEnviarResposta} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                  Status do Chamado
                </label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                  }}
                >
                  <option value="ABERTO">ABERTO</option>
                  <option value="EM_ANDAMENTO">EM_ANDAMENTO</option>
                  <option value="RESOLVIDO">RESOLVIDO</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "4px" }}>
                  Resposta / Orientação ao Usuário
                </label>
                <textarea
                  rows={4}
                  placeholder="Digite a solução ou esclarecimento técnico..."
                  value={respostaTexto}
                  onChange={(e) => setRespostaTexto(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setSelectedChamado(null)}
                  disabled={submittingResposta}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-btn" disabled={submittingResposta}>
                  {submittingResposta ? "Enviando..." : "Enviar Resposta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criar / Editar FAQ */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <form
            onSubmit={handleSubmit}
            className="panel"
            style={{ ...modalContentStyle, maxWidth: "520px", padding: "24px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>
                {editingId ? `Editar Pergunta #${editingId}` : "Nova Pergunta Frequente"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <label style={{ display: "block", marginBottom: "12px" }}>
              Categoria
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
              >
                <option value="Reservas">Reservas</option>
                <option value="Equipamentos">Equipamentos</option>
                <option value="Acesso">Acesso & Conta</option>
                <option value="Geral">Geral</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "12px" }}>
              Pergunta
              <input
                required
                placeholder="Ex: Como posso cancelar uma reserva?"
                value={pergunta}
                onChange={(e) => setPergunta(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
              />
            </label>

            <label style={{ display: "block", marginBottom: "16px" }}>
              Resposta detalhada
              <textarea
                required
                rows={5}
                placeholder="Escreva a instrução para o usuário..."
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", marginTop: "4px" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button type="submit" className="primary-btn" disabled={submitting}>
                {submitting ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Pergunta"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Customizado de Confirmação de Exclusão */}
      {deleteConfirmId && (
        <div style={modalOverlayStyle}>
          <div
            className="panel"
            style={{ ...modalContentStyle, maxWidth: "420px", padding: "24px", textAlign: "center" }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <Icon name="tool" size={24} />
            </div>

            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 8px 0" }}>
              Excluir pergunta frequente?
            </h3>

            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0", lineHeight: "1.5" }}>
              Tem certeza que deseja excluir esta pergunta do FAQ? Esta ação removerá o item permanentemente da plataforma.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setDeleteConfirmId(null)}
                style={{ flex: 1, padding: "10px 16px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "20px",
};

const modalContentStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#fff",
  borderRadius: "12px",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
};