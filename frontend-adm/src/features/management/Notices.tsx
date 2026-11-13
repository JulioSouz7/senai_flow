import { useState, useEffect } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { Icon } from "../../components/icons/Icon";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";

interface ComunicadoDB {
  id_comunicado: number;
  id_turma?: number | null;
  id_reserva?: number | null;
  titulo: string;
  conteudo: string;
  abrangencia: string; // 'GERAL' | 'TURMA'
  publico_alvo?: string | null;
  dt_publicacao?: string;
  criado_em?: string;
  createdAt?: string;
  turma?: {
    id_turma: number;
    nome?: string;
    curso?: string;
  } | null;
}

export function Notices({ notify }: { notify: (text: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [comunicados, setComunicados] = useState<ComunicadoDB[]>([]);

  // Comunicado Selecionado para Leitura
  const [selectedNotice, setSelectedNotice] = useState<ComunicadoDB | null>(null);

  // Modal de Confirmação de Exclusão
  const [confirmDeleteNotice, setConfirmDeleteNotice] = useState<ComunicadoDB | null>(null);
  const [deletingNotice, setDeletingNotice] = useState(false);

  // Estados de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Pesquisa
  const [searchTerm, setSearchTerm] = useState("");

  // Formulário
  const [abrangencia, setAbrangencia] = useState<"GERAL" | "TURMA">("GERAL");
  const [idTurma, setIdTurma] = useState<string>("1");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");

  // Busca agregada dos comunicados no PostgreSQL
  const fetchNotices = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);
      const allMap = new Map<number, ComunicadoDB>();

      // 1. Consulta rotas de listagem
      const listResults = await Promise.allSettled([
        api.get("/comunicados"),
        api.get("/comunicados/gerais"),
        api.get("/comunicados/minha-turma"),
      ]);

      listResults.forEach((res) => {
        if (res.status === "fulfilled" && Array.isArray(res.value.data)) {
          res.value.data.forEach((item: ComunicadoDB) => {
            if (item && item.id_comunicado) {
              allMap.set(item.id_comunicado, item);
            }
          });
        }
      });

      // 2. Varredura por ID direto (1 a 50) para garantir captura dos dados completos com 'turma'
      const idPromises = Array.from({ length: 50 }, (_, i) =>
        api.get(`/comunicados/${i + 1}`)
      );
      const idResults = await Promise.allSettled(idPromises);

      idResults.forEach((res) => {
        if (res.status === "fulfilled" && res.value.data) {
          const data = Array.isArray(res.value.data) ? res.value.data[0] : res.value.data;
          if (data && data.id_comunicado) {
            allMap.set(data.id_comunicado, data);
          }
        }
      });

      setComunicados(Array.from(allMap.values()));
      const allRequestsFailed = listResults.every((res) => res.status === "rejected")
        && idResults.every((res) => res.status === "rejected");
      if (manual) notify(allRequestsFailed ? "Não foi possível atualizar os comunicados." : "Comunicados atualizados.");
    } catch (error) {
      console.error("Erro ao carregar comunicados:", error);
      if (manual) notify("Não foi possível atualizar os comunicados.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Prepara o formulário para edição
  const handleEditClick = (item: ComunicadoDB, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    setTitulo(item.titulo);
    setConteudo(item.conteudo);
    setAbrangencia((item.abrangencia as "GERAL" | "TURMA") || "GERAL");
    setIdTurma(item.id_turma ? item.id_turma.toString() : "1");

    setIsEditing(true);
    setEditingId(item.id_comunicado);
    setSelectedNotice(null);
    setSent(false);
  };

  // Cancela o modo de edição
  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitulo("");
    setConteudo("");
    setAbrangencia("GERAL");
    setIdTurma("1");
    setSent(false);
  };

  // Exclusão física no PostgreSQL
  const deleteComunicadoApi = async (id: number) => {
    try {
      await api.delete(`/comunicados/${id}`);
    } catch {
      try {
        await api.delete(`/comunicados/geral/${id}`);
      } catch {
        await api.delete(`/comunicados/turma/${id}`);
      }
    }
  };

  // Abre o modal de confirmação de exclusão
  const handleDeleteClick = (item: ComunicadoDB, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDeleteNotice(item);
  };

  // Executa a exclusão após confirmação e dispara a notificação padrão
  const handleConfirmDelete = async () => {
    if (!confirmDeleteNotice) return;

    const id = confirmDeleteNotice.id_comunicado;

    try {
      setDeletingNotice(true);
      await deleteComunicadoApi(id);
      setConfirmDeleteNotice(null);
      notify?.(`Comunicado #${id} excluído com sucesso!`);
      setComunicados((prev) => prev.filter((item) => item.id_comunicado !== id));
      if (selectedNotice?.id_comunicado === id) setSelectedNotice(null);
      if (editingId === id) cancelEdit();
    } catch (error: any) {
      console.error("Erro ao deletar comunicado:", error);
      const msg =
        error?.response?.data?.mensagem ||
        error?.response?.data?.message ||
        "Erro ao excluir comunicado.";
      setConfirmDeleteNotice(null);
      notify?.(msg);
    } finally {
      setDeletingNotice(false);
    }
  };

  // Função auxiliar para enviar o POST do comunicado
  const postComunicado = async (payload: any) => {
    if (abrangencia === "GERAL") {
      try {
        await api.post("/comunicados/geral", payload);
      } catch {
        await api.post("/comunicados", payload);
      }
    } else {
      try {
        await api.post("/comunicados/turma", payload);
      } catch {
        await api.post("/comunicados", payload);
      }
    }
  };

  // Publicação ou Edição Direta Nativa (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim() || !conteudo.trim()) {
      return notify?.("Preencha o título e a mensagem do comunicado.");
    }

    try {
      setSubmitting(true);
      setSent(false);

      const payload = {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        abrangencia,
        id_turma: abrangencia === "TURMA" ? Number(idTurma) || 1 : null,
      };

      if (isEditing && editingId) {
        await api.put(`/comunicados/${editingId}`, payload);
        notify?.("Comunicado atualizado com sucesso!");
        cancelEdit();
      } else {
        await postComunicado(payload);
        setSent(true);
        notify?.("Comunicado publicado com sucesso!");
        setTitulo("");
        setConteudo("");
        setAbrangencia("GERAL");
      }

      await fetchNotices();
    } catch (error: any) {
      console.error("Erro ao salvar comunicado:", error);
      const msg = error?.response?.data?.message || "Erro ao processar o comunicado.";
      notify?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getPublicoLabel = (item: ComunicadoDB) => {
    if (item.abrangencia === "TURMA" || item.id_turma) {
      if (item.turma?.nome) {
        return `Turma #${item.id_turma || item.turma.id_turma} (${item.turma.nome})`;
      }
      if (item.id_turma) {
        return `Turma #${item.id_turma}`;
      }
      if (item.publico_alvo && item.publico_alvo !== "Turma específica") {
        return item.publico_alvo;
      }
      return "Turma específica";
    }
    return item.publico_alvo || "Toda a instituição";
  };

  const formatDateLabel = (item: ComunicadoDB) => {
    const rawDate = item.dt_publicacao || item.criado_em || item.createdAt;
    if (!rawDate) return "Data indisponível";
    try {
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return rawDate;
      return (
        d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
        " às " +
        d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      );
    } catch {
      return rawDate;
    }
  };

  const filteredComunicados = comunicados.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const cleanTerm = term.replace("#", "");

    const matchesId = item.id_comunicado.toString() === cleanTerm;
    const matchesTitle = item.titulo?.toLowerCase().includes(term);
    const matchesContent = item.conteudo?.toLowerCase().includes(term);

    return matchesId || matchesTitle || matchesContent;
  });

  const sortedAndLimited = [...filteredComunicados]
    .sort((a, b) => b.id_comunicado - a.id_comunicado)
    .slice(0, 5);

  return (
    <>
      <PageTitle
        eyebrow="CANAL OFICIAL DO CAMPUS"
        title="Comunicados"
        text="Publique avisos formais globais ou segmentados por turma."
        action={<RefreshButton refreshing={refreshing} onRefresh={() => void fetchNotices(true)} />}
      />

      <div className="notice-layout">
        {/* Painel Esquerdo: Formulário */}
        <form className="panel notice-form" onSubmit={handleSubmit}>
          {isEditing && (
            <div style={{ backgroundColor: "#eff6ff", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", border: "1px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#1d4ed8", fontSize: "13px", fontWeight: 600 }}>
                Editando o comunicado #{editingId}
              </span>
            </div>
          )}

          <label>
            Público
            <select
              value={abrangencia}
              onChange={(e) => setAbrangencia(e.target.value as "GERAL" | "TURMA")}
            >
              <option value="GERAL">Toda a unidade (Geral)</option>
              <option value="TURMA">Turma específica</option>
            </select>
          </label>

          {abrangencia === "TURMA" && (
            <label>
              ID da Turma
              <input
                type="number"
                value={idTurma}
                onChange={(e) => setIdTurma(e.target.value)}
                placeholder="Ex: 1"
                required
              />
            </label>
          )}

          <label>
            Título
            <input
              required
              placeholder="Título do comunicado"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </label>

          <label>
            Mensagem
            <textarea
              required
              minLength={20}
              rows={6}
              placeholder="Escreva a comunicação institucional..."
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
            />
          </label>

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="primary-btn" disabled={submitting} style={{ flex: 1 }}>
              {submitting
                ? isEditing
                  ? "Salvando..."
                  : "Publicando..."
                : isEditing
                ? "Salvar alterações"
                : "Publicar comunicado"}
            </button>

            {isEditing && (
              <button
                type="button"
                className="secondary-btn"
                onClick={cancelEdit}
                disabled={submitting}
              >
                Cancelar
              </button>
            )}
          </div>

          {sent && !isEditing && <p className="success-message">Publicado no canal oficial com sucesso.</p>}
        </form>

        {/* Painel Direito: Publicações Recentes */}
        <article className="panel published" style={{ boxSizing: "border-box", overflow: "hidden" }}>
          <div className="panel-head">
            <div>
              <h2>Publicações recentes</h2>
              <p>Histórico institucional (máx. 5)</p>
            </div>
          </div>

          <div style={{ padding: "0 24px 16px 24px", boxSizing: "border-box", width: "100%" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Pesquisar por ID (#1) ou palavra-chave..."
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
              <span style={{ position: "absolute", left: "12px", color: "#94a3b8", display: "flex", alignItems: "center" }}>
                <Icon name="search" size={16} />
              </span>
            </div>
          </div>

          {loading ? (
            <p style={{ padding: "20px 24px", color: "#64748b", textAlign: "center" }}>
              Carregando publicações...
            </p>
          ) : sortedAndLimited.length > 0 ? (
            sortedAndLimited.map((item) => (
              <div
                className="published-row"
                key={item.id_comunicado}
                onClick={() => setSelectedNotice(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "16px 24px",
                  boxSizing: "border-box",
                  borderBottom: "1px solid #f1f5f9",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                  backgroundColor: editingId === item.id_comunicado ? "#f8fafc" : "transparent",
                }}
              >
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flex: 1, minWidth: 0 }}>
                  <span style={{ flexShrink: 0 }}>
                    <Icon name="message" size={18} />
                  </span>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    <b style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      {item.titulo}
                      <span
                        style={{
                          fontSize: "11px",
                          backgroundColor: "#f1f5f9",
                          color: "#64748b",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: 500,
                        }}
                      >
                        #{item.id_comunicado}
                      </span>
                    </b>
                    <p style={{ margin: "2px 0", fontSize: "13px", color: "#64748b" }}>
                      {getPublicoLabel(item)}
                    </p>
                    <small style={{ fontSize: "12px", color: "#94a3b8" }}>
                      {formatDateLabel(item)}
                    </small>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={(e) => handleEditClick(item, e)}
                    title="Editar comunicado"
                    style={{
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#16a34a",
                      cursor: "pointer",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(item, e)}
                    title="Excluir comunicado"
                    style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      cursor: "pointer",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Excluir
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ padding: "20px 24px", color: "#94a3b8", textAlign: "center" }}>
              Nenhum comunicado encontrado.
            </p>
          )}
        </article>
      </div>

      {/* MODAL DE VISUALIZAÇÃO DO COMUNICADO SELECIONADO */}
      {selectedNotice && (
        <div style={modalOverlayStyle}>
          <div className="panel" style={{ ...modalContentStyle, maxWidth: "580px", width: "100%", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span
                  style={{
                    fontSize: "12px",
                    backgroundColor: "#f1f5f9",
                    color: "#64748b",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: 600,
                  }}
                >
                  Comunicado #{selectedNotice.id_comunicado}
                </span>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "8px 0 0 0" }}>
                  {selectedNotice.titulo}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "20px",
                padding: "12px 16px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", fontWeight: 700, textTransform: "uppercase" }}>
                  Abrangência / Público
                </span>
                <b style={{ fontSize: "13px", color: "#334155", marginTop: "2px", display: "block" }}>
                  {getPublicoLabel(selectedNotice)}
                </b>
              </div>

              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", fontWeight: 700, textTransform: "uppercase" }}>
                  Data de Publicação
                </span>
                <b style={{ fontSize: "13px", color: "#334155", marginTop: "2px", display: "block" }}>
                  {formatDateLabel(selectedNotice)}
                </b>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", fontWeight: 700, textTransform: "uppercase", marginBottom: "6px" }}>
                Conteúdo do Comunicado
              </span>
              <div
                style={{
                  backgroundColor: "#fff",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  color: "#1e293b",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  maxHeight: "260px",
                  overflowY: "auto",
                }}
              >
                {selectedNotice.conteudo}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => handleEditClick(selectedNotice)}
                style={{ padding: "8px 20px" }}
              >
                Editar
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => setSelectedNotice(null)}
                style={{ padding: "8px 20px" }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {confirmDeleteNotice && (
        <div style={{ ...modalOverlayStyle, zIndex: 1100 }}>
          <div
            className="panel"
            style={{
              ...modalContentStyle,
              maxWidth: "420px",
              padding: "28px 24px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              margin: 0,
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>

            <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "18px", fontWeight: 700 }}>
              Confirmar Exclusão
            </h3>
            <p style={{ margin: "0 0 24px", color: "#475569", fontSize: "14px", lineHeight: "1.5" }}>
              Tem certeza que deseja excluir o comunicado{" "}
              <b style={{ color: "#0f172a" }}>
                #{confirmDeleteNotice.id_comunicado} ({confirmDeleteNotice.titulo})
              </b>
              ? Esta ação não poderá ser desfeita.
            </p>

            <div style={{ display: "flex", gap: "12px", width: "100%" }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ flex: 1, padding: "10px 16px" }}
                onClick={() => setConfirmDeleteNotice(null)}
                disabled={deletingNotice}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  backgroundColor: "#dc2626",
                  borderColor: "#dc2626",
                }}
                onClick={handleConfirmDelete}
                disabled={deletingNotice}
              >
                {deletingNotice ? "Excluindo..." : "Confirmar"}
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
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
};