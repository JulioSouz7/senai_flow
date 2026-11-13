import { useState, useEffect } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { Icon } from "../../components/icons/Icon";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";

export interface RelatoDB {
  id_relato?: number;
  id?: number;
  id_relatos_sugestoes?: number;
  protocolo?: string;
  nome_remetente?: string;
  tipo_usuario?: string;
  tipo?: string;
  usuario?: { nome?: string; email?: string; tipo?: string };
  assunto?: string;
  descricao?: string;
  conteudo?: string;
  status?: string; // Backend: 'ENVIADO' | 'LIDO' | 'CORPORATIVO'
  resposta?: string;
  resposta_institucional?: string;
  dt_envio?: string;
  prazo_resposta?: string;
  criado_em?: string;
  createdAt?: string;
  encaminhada_corporativo?: boolean;
}

type FilterType = "ENVIADO" | "RESPONDIDO" | "CORPORATIVO" | "TODOS";

export function SuggestionsDesk({ notify }: { notify: (text: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<RelatoDB[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("TODOS");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedRelato, setSelectedRelato] = useState<RelatoDB | null>(null);
  const [respostaText, setRespostaText] = useState("");
  const [statusSelect, setStatusSelect] = useState<"ENVIADO" | "RESPONDIDO" | "CORPORATIVO">("RESPONDIDO");
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);
      const res = await api.get("/relatos-sugestoes");
      if (Array.isArray(res.data)) {
        setReports(res.data);
      }
      if (manual) notify("Relatos e sugestões atualizados.");
    } catch (error) {
      console.error("Erro ao carregar relatos:", error);
      if (manual) notify("Não foi possível atualizar os relatos e sugestões.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getRelatoId = (item: RelatoDB): number => {
    return item.id_relato ?? item.id ?? item.id_relatos_sugestoes ?? 1;
  };

  const formatProtocol = (item: RelatoDB) => {
    if (item.protocolo) return item.protocolo;
    const id = getRelatoId(item);
    return `#RL-${String(id).padStart(4, "0")}`;
  };

  const formatSender = (item: RelatoDB) => {
    const nome = item.nome_remetente || item.usuario?.nome || "Usuário Anônimo";
    const tipo = item.tipo_usuario || item.usuario?.tipo || (item.tipo === "RECLAMACAO" ? "Reclamação" : "Geral");
    return `${nome} • ${tipo}`;
  };

  const formatDateEnvio = (item: RelatoDB) => {
    const rawDate = item.dt_envio || item.criado_em || item.createdAt;
    if (!rawDate) return "Data não informada";
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

  const getItemCategory = (item: RelatoDB): "ENVIADO" | "RESPONDIDO" | "CORPORATIVO" => {
    const st = (item.status || "").toUpperCase();
    if (st === "CORPORATIVO" || st === "ARQUIVADO") {
      return "CORPORATIVO";
    }
    if (st === "LIDO" || st === "RESPONDIDO") {
      return "RESPONDIDO";
    }
    return "ENVIADO";
  };

  const calculateDeadline = (item: RelatoDB) => {
    const cat = getItemCategory(item);
    if (cat === "CORPORATIVO") return "Arquivado";
    if (cat === "RESPONDIDO") return "Concluído";

    if (item.prazo_resposta) {
      const hoje = new Date();
      const prazo = new Date(item.prazo_resposta);
      const diffDays = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 3600 * 24));

      if (diffDays <= 0) return "Prazo expirado";
      if (diffDays === 1) return "1 dia restante";
      return `${diffDays} dias restantes`;
    }

    const rawDate = item.dt_envio || item.criado_em || item.createdAt;
    if (!rawDate) return "5 dias restantes";

    try {
      const created = new Date(rawDate);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 3600 * 24));
      const daysLeft = 5 - diffDays;

      if (daysLeft < 0) return "Prazo expirado";
      if (daysLeft === 0) return "Prazo vence hoje";
      if (daysLeft === 1) return "1 dia restante";
      return `${daysLeft} dias restantes`;
    } catch {
      return "5 dias restantes";
    }
  };

  const renderStatusBadge = (item: RelatoDB) => {
    const cat = getItemCategory(item);
    switch (cat) {
      case "ENVIADO":
        return (
          <span style={{ ...badgeStyle, backgroundColor: "#e0f2fe", color: "#0369a1" }}>
            Enviado
          </span>
        );
      case "RESPONDIDO":
        return (
          <span style={{ ...badgeStyle, backgroundColor: "#d1fae5", color: "#047857" }}>
            Respondido
          </span>
        );
      case "CORPORATIVO":
        return (
          <span style={{ ...badgeStyle, backgroundColor: "#f3e8ff", color: "#7e22ce" }}>
            Arquivado (Corporativo)
          </span>
        );
    }
  };

  const handleOpenRelatoDetails = (item: RelatoDB) => {
    setSelectedRelato(item);
    const textResp = item.resposta || item.resposta_institucional || "";
    setRespostaText(textResp);
    setStatusSelect(getItemCategory(item));
  };

 // SALVAR RESPOSTA E STATUS (Aceita resposta em branco)
  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelato) return;

    const targetId = getRelatoId(selectedRelato);
    setSubmitting(true);

    // Traduz 'RESPONDIDO' da tela para 'LIDO' (aceito pelo enum do backend)
    const statusBackend = statusSelect === "RESPONDIDO" ? "LIDO" : statusSelect;
    
    // Envia a string limpa ou vazia para o backend tratar como null
    const textFormatado = respostaText.trim();

    try {
      await api.patch(`/relatos-sugestoes/${targetId}/responder`, {
        status: statusBackend,
        resposta: textFormatado,
      });

      notify(`Relato ${formatProtocol(selectedRelato)} atualizado com sucesso!`);
      setSelectedRelato(null);
      setRespostaText("");
      await fetchReports();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.mensagem ||
        "Erro ao atualizar atendimento no servidor.";
      notify(msg);
    } finally {
      setSubmitting(false);
    }
  };
  
  // ARQUIVAR RELATO (Chama a rota exata: PATCH /relatos-sugestoes/:id/arquivar)
  const handleArchive = async (item: RelatoDB, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetId = getRelatoId(item);

    if (!window.confirm(`Deseja arquivar o relato ${formatProtocol(item)}?`)) {
      return;
    }

    try {
      await api.patch(`/relatos-sugestoes/${targetId}/arquivar`);
      notify(`Relato ${formatProtocol(item)} arquivado com sucesso.`);
      await fetchReports();
    } catch {
      notify("Erro ao arquivar relato.");
    }
  };

  const handleDeletePermanent = async (item: RelatoDB, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetId = getRelatoId(item);

    if (!window.confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o relato ${formatProtocol(item)}?`)) {
      return;
    }

    try {
      await api.delete(`/relatos-sugestoes/${targetId}`);
      setReports((prev) => prev.filter((r) => getRelatoId(r) !== targetId));
      notify(`Relato ${formatProtocol(item)} excluído.`);
    } catch {
      notify("Erro ao excluir relato do banco de dados.");
    }
  };

  const countEnviados = reports.filter((r) => getItemCategory(r) === "ENVIADO").length;
  const countRespondidos = reports.filter((r) => getItemCategory(r) === "RESPONDIDO").length;
  const countCorporativo = reports.filter((r) => getItemCategory(r) === "CORPORATIVO").length;
  const countTodos = reports.length;

  const visibleReports = reports.filter((r) => {
    if (activeFilter !== "TODOS" && getItemCategory(r) !== activeFilter) {
      return false;
    }

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim().replace("#rl-", "").replace("#", "");
      const idStr = String(getRelatoId(r));
      const protoStr = formatProtocol(r).toLowerCase();
      const nomeStr = (r.nome_remetente || r.usuario?.nome || "").toLowerCase();
      const assuntoStr = (r.assunto || r.descricao || r.conteudo || "").toLowerCase();

      return idStr.includes(query) || protoStr.includes(query) || nomeStr.includes(query) || assuntoStr.includes(query);
    }

    return true;
  });

  const filterOptions: { key: FilterType; label: string; count: number }[] = [
    { key: "ENVIADO", label: "Enviados", count: countEnviados },
    { key: "RESPONDIDO", label: "Respondidos", count: countRespondidos },
    { key: "CORPORATIVO", label: "Arquivados (Corporativo)", count: countCorporativo },
    { key: "TODOS", label: "Todos", count: countTodos },
  ];

  return (
    <>
      <PageTitle
        eyebrow="ATENDIMENTO INSTITUCIONAL"
        title="Relatos e sugestões"
        text="Responda em até 5 dias. Mensagens arquivadas permanecem no histórico institucional."
        action={<RefreshButton refreshing={refreshing} onRefresh={() => void fetchReports(true)} />}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px", marginBottom: "20px" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "520px" }}>
          <input
            type="text"
            placeholder="Pesquisar por ID, protocolo, nome do remetente ou assunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px 14px 10px 36px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              outline: "none",
              backgroundColor: "#fff",
            }}
          />
          <span style={{ position: "absolute", left: "12px", top: "10px", color: "#94a3b8" }}>
            <Icon name="search" size={16} />
          </span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", overflowX: "auto", whiteSpace: "nowrap" }}>
          {filterOptions.map((opt) => {
            const isActive = activeFilter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setActiveFilter(opt.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 18px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                  border: isActive ? "1px solid #dc2626" : "1px solid #cbd5e1",
                  backgroundColor: isActive ? "#dc2626" : "#fff",
                  color: isActive ? "#fff" : "#475569",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
              >
                <span>{opt.label}</span>
                <span
                  style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    backgroundColor: isActive ? "rgba(255, 255, 255, 0.25)" : "#f1f5f9",
                    color: isActive ? "#fff" : "#64748b",
                    fontWeight: 600,
                  }}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel table-panel">
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <th style={{ padding: "12px 16px" }}>Protocolo</th>
                <th style={{ padding: "12px 16px" }}>Remetente / Envio</th>
                <th style={{ padding: "12px 16px" }}>Assunto</th>
                <th style={{ padding: "12px 16px" }}>Prazo</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                    Carregando relatos...
                  </td>
                </tr>
              ) : visibleReports.length > 0 ? (
                visibleReports.map((r) => {
                  const idKey = getRelatoId(r);
                  const protocolStr = formatProtocol(r);
                  const deadlineStr = calculateDeadline(r);
                  const isExpiredOrToday = deadlineStr.includes("hoje") || deadlineStr.includes("expirado");
                  const cat = getItemCategory(r);

                  return (
                    <tr
                      key={idKey}
                      onClick={() => handleOpenRelatoDetails(r)}
                      style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                    >
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0f172a" }}>
                        <b>{protocolStr}</b>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#334155" }}>
                        <div>{formatSender(r)}</div>
                        <small style={{ color: "#64748b", fontSize: "11px", display: "block", marginTop: "2px" }}>
                          📅 {formatDateEnvio(r)}
                        </small>
                      </td>
                      <td style={{ padding: "14px 16px", color: "#334155", maxWidth: "280px" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.assunto || r.descricao || r.conteudo || "Sem assunto"}
                        </div>
                        {(r.resposta || r.resposta_institucional) && (
                          <small style={{ color: "#047857", display: "block", marginTop: "2px", fontWeight: 500 }}>
                            <b>Resposta:</b> {r.resposta || r.resposta_institucional}
                          </small>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", color: "#64748b" }}>
                        <span className={isExpiredOrToday ? "deadline" : ""}>
                          {deadlineStr}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {renderStatusBadge(r)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenRelatoDetails(r)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#dc2626",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {cat === "RESPONDIDO" ? "Editar Resposta" : "Ver / Responder"}
                            <Icon name="arrow" size={13} />
                          </button>

                          {cat !== "CORPORATIVO" && (
                            <button
                              type="button"
                              onClick={(e) => handleArchive(r, e)}
                              title="Arquivar relato"
                              style={{
                                background: "none",
                                border: "1px solid #cbd5e1",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "12px",
                                color: "#64748b",
                              }}
                            >
                              Arquivar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleDeletePermanent(r, e)}
                            title="Excluir do banco de dados"
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "4px",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                    Nenhum relato encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRelato && (
        <div style={modalOverlayStyle}>
          <div className="panel" style={modalContentStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Atendimento ({formatProtocol(selectedRelato)})
              </h2>
              <button
                type="button"
                onClick={() => setSelectedRelato(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 6px 0", color: "#475569" }}>
                <b>ID no Banco:</b> #{getRelatoId(selectedRelato)}
              </p>
              <p style={{ margin: "0 0 6px 0", color: "#475569" }}>
                <b>Remetente:</b> {formatSender(selectedRelato)}
              </p>
              <p style={{ margin: "0 0 6px 0", color: "#475569" }}>
                <b>Data de Envio:</b> {formatDateEnvio(selectedRelato)}
              </p>
              <p style={{ margin: "0 0 6px 0", color: "#475569" }}>
                <b>Assunto:</b> {selectedRelato.assunto || (selectedRelato.tipo === "RECLAMACAO" ? "Reclamação" : "Sugestão")}
              </p>
              <p style={{ margin: 0, color: "#1e293b", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                <b>Relato / Conteúdo:</b> {selectedRelato.descricao || selectedRelato.conteudo || "Sem detalhamento"}
              </p>
            </div>

            <form onSubmit={handleSendResponse}>
              <label style={labelStyle}>Status do Atendimento</label>
              <select
                value={statusSelect}
                onChange={(e) => setStatusSelect(e.target.value as any)}
                style={inputStyle}
              >
                <option value="ENVIADO">Enviado (Pendente)</option>
                <option value="RESPONDIDO">Respondido (Concluído)</option>
                <option value="CORPORATIVO">Arquivado (Corporativo)</option>
              </select>

              <label style={{ ...labelStyle, marginTop: "12px" }}>Resposta Institucional ao Usuário</label>
              <textarea
                rows={5}
                placeholder="Escreva a resposta ou esclarecimento que será enviado ao solicitante..."
                value={respostaText}
                onChange={(e) => setRespostaText(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                  marginBottom: "16px",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setSelectedRelato(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={submitting}
                >
                  {submitting ? "Gravando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const badgeStyle: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: "12px",
  fontSize: "11px",
  fontWeight: 700,
  display: "inline-block",
};

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
  maxWidth: "560px",
  backgroundColor: "#fff",
  padding: "24px",
  borderRadius: "12px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#475569",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
  boxSizing: "border-box",
  marginBottom: "8px",
};