import { useState, useEffect } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { Icon } from "../../components/icons/Icon";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";

export function Assets({ notify }: { notify?: (text: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avarias, setAvarias] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndex, setFilterIndex] = useState(0);
  const [selectedAvaria, setSelectedAvaria] = useState<any | null>(null);
  const [imageError, setImageError] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Controle do modal de confirmação
  const [confirmFinalize, setConfirmFinalize] = useState<{ id: number; status: string } | null>(null);

  const filterOptions = ["Abertos", "Em análise", "Concluídos", "Todos"];

  const normalizeStatus = (status?: string) => {
    if (!status) return "ENCAMINHADO";
    return status
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s\-_]/g, "");
  };

  const isStatusFinalizado = (status?: string) => {
    const norm = normalizeStatus(status);
    return norm === "FINALIZADO" || norm === "CONCLUIDO";
  };

  const getImageUrl = (path?: string) => {
    if (!path || path === "sem-foto.png" || path.trim() === "") return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    let serverOrigin = "http://localhost:3000";
    if (api.defaults.baseURL) {
      try {
        if (api.defaults.baseURL.startsWith("http")) {
          serverOrigin = new URL(api.defaults.baseURL).origin;
        }
      } catch (e) {
        console.error("Erro ao resolver URL base:", e);
      }
    }

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${serverOrigin}${cleanPath}`;
  };

  const fetchAvarias = async (manual = false) => {
    try {
      if (manual) setRefreshing(true);
      else setLoading(true);
      const response = await api.get("/avarias");
      if (Array.isArray(response.data)) {
        setAvarias(response.data);
      }
      if (manual) notify?.("Avarias e ativos atualizados.");
    } catch (error) {
      console.error("Erro ao carregar avarias:", error);
      notify?.(manual ? "Erro ao atualizar a lista de avarias." : "Erro ao carregar a lista de avarias.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAvarias();
  }, []);

  const handleUpdateStatusRequest = (id: number, newStatus: string) => {
    const currentItem =
      selectedAvaria?.id_avaria === id
        ? selectedAvaria
        : avarias.find((item) => item.id_avaria === id);

    if (currentItem && isStatusFinalizado(currentItem.status)) {
      notify?.("Chamados finalizados não podem mais voltar para Em análise.");
      return;
    }

    if (normalizeStatus(newStatus) === "FINALIZADO") {
      setConfirmFinalize({ id, status: newStatus });
    } else {
      executeStatusUpdate(id, newStatus);
    }
  };

  const executeStatusUpdate = async (id: number, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      let success = false;
      let lastError: any = null;

      const attempts = [
        () => api.patch(`/avarias/${id}/status`, { status: newStatus }),
        () => api.put(`/avarias/${id}/status`, { status: newStatus }),
        () => api.patch(`/avarias/${id}`, { status: newStatus }),
        () => api.put(`/avarias/${id}`, { status: newStatus }),
      ];

      for (const attempt of attempts) {
        try {
          await attempt();
          success = true;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!success) {
        throw lastError || new Error("Falha ao atualizar status no servidor.");
      }

      const labelFormatada = formatStatus(newStatus);
      notify?.(`Chamado #AV-${id} alterado para ${labelFormatada}.`);

      setAvarias((prev) =>
        prev.map((item) => (item.id_avaria === id ? { ...item, status: newStatus } : item))
      );

      setConfirmFinalize(null);
      setSelectedAvaria(null);
      fetchAvarias(true);
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      const msgErro =
        error?.response?.data?.mensagem ||
        error?.response?.data?.message ||
        "Erro ao atualizar status no servidor.";
      notify?.(msgErro);
      setConfirmFinalize(null);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatStatus = (status: string) => {
    const norm = normalizeStatus(status);
    if (norm === "EMANALISE") return "Em análise";
    if (norm === "FINALIZADO" || norm === "CONCLUIDO") return "Concluído";
    if (["ENCAMINHADO", "ABERTO", "PENDENTE", "NOVO"].includes(norm)) return "Aberto";
    return status || "Aberto";
  };

  const getStatusStyle = (status: string) => {
    const norm = normalizeStatus(status);
    if (norm === "FINALIZADO" || norm === "CONCLUIDO") {
      return { backgroundColor: "#dcfce7", color: "#166534", fontWeight: 600 };
    }
    if (norm === "EMANALISE") {
      return { backgroundColor: "#fef3c7", color: "#92400e", fontWeight: 600 };
    }
    return {};
  };

  const sortedAvarias = [...avarias].sort((a, b) => a.id_avaria - b.id_avaria);

  const filteredAvarias = sortedAvarias.filter((item) => {
    const normStatus = normalizeStatus(item.status);
    let matchesTab = true;

    // Filtros: 0: Abertos, 1: Em Análise, 2: Concluídos, 3: Todos
    if (filterIndex === 0) matchesTab = ["ENCAMINHADO", "ABERTO", "PENDENTE", "NOVO"].includes(normStatus);
    if (filterIndex === 1) matchesTab = normStatus === "EMANALISE";
    if (filterIndex === 2) matchesTab = ["FINALIZADO", "CONCLUIDO"].includes(normStatus);
    if (filterIndex === 3) matchesTab = true;

    const query = searchTerm.toLowerCase();
    const equipNome = item.equipamento?.nome?.toLowerCase() || "";
    const equipNif = item.equipamento?.nif?.toLowerCase() || "";
    const salaNome = item.sala?.nome?.toLowerCase() || "";
    const protocol = `#av-${item.id_avaria}`;

    const matchesSearch =
      equipNome.includes(query) ||
      equipNif.includes(query) ||
      salaNome.includes(query) ||
      protocol.includes(query);

    return matchesTab && matchesSearch;
  });

  const currentModalNormStatus = selectedAvaria ? normalizeStatus(selectedAvaria.status) : "";
  const isModalEmAnalise = currentModalNormStatus === "EMANALISE";
  const isModalFinalizado = isStatusFinalizado(selectedAvaria?.status);

  return (
    <>
      <PageTitle
        eyebrow="PATRIMÔNIO E MANUTENÇÃO"
        title="Avarias e ativos"
        text="Rastreabilidade completa por NIF, ambiente e prioridade."
        action={<RefreshButton refreshing={refreshing} onRefresh={() => void fetchAvarias(true)} />}
      />

      <div className="filterbar">
        <label>
          <Icon name="search" size={16} />
          <input
            placeholder="Buscar NIF, ativo ou sala..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>
        {filterOptions.map((x, i) => (
          <button
            className={filterIndex === i ? "active" : ""}
            onClick={() => setFilterIndex(i)}
            key={x}
          >
            {x}
          </button>
        ))}
      </div>

      <article className="panel table-panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Chamado</th>
                <th>Equipamento</th>
                <th>Patrimônio</th>
                <th>Local</th>
                <th>Prioridade</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 30, textAlign: "center" }}>
                    Carregando avarias...
                  </td>
                </tr>
              ) : filteredAvarias.length > 0 ? (
                filteredAvarias.map((a) => {
                  const protocol = `#AV-${a.id_avaria}`;
                  const equipNome = a.equipamento?.nome || "Equipamento não informado";
                  const nifTexto = a.equipamento?.nif ? `NIF ${a.equipamento.nif}` : "Sem NIF";
                  const salaNome = a.sala?.nome || "N/A";
                  const gravidade = a.gravidade
                    ? a.gravidade.charAt(0).toUpperCase() + a.gravidade.slice(1).toLowerCase()
                    : "Média";

                  return (
                    <tr key={a.id_avaria}>
                      <td><b>{protocol}</b></td>
                      <td>{equipNome}</td>
                      <td>{nifTexto}</td>
                      <td>{salaNome}</td>
                      <td>
                        <span className={`badge ${gravidade.toLowerCase()}`}>
                          {gravidade}
                        </span>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={getStatusStyle(a.status)}
                        >
                          {formatStatus(a.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="row-btn"
                          onClick={() => {
                            setSelectedAvaria(a);
                            setImageError(false);
                          }}
                        >
                          Detalhes <Icon name="arrow" size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#6b7280" }}>
                    Nenhum registro de avaria encontrado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Modal Principal de Detalhes da Avaria */}
      {selectedAvaria && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div className="panel" style={{ width: "100%", maxWidth: "540px", background: "#fff", padding: "24px", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2 style={{ margin: 0 }}>Chamado #AV-{selectedAvaria.id_avaria}</h2>
                <span
                  className="status-badge"
                  style={getStatusStyle(selectedAvaria.status)}
                >
                  {formatStatus(selectedAvaria.status)}
                </span>
              </div>
              <button
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}
                onClick={() => setSelectedAvaria(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: "10px", fontSize: "14px", marginBottom: "20px" }}>
              <p><b>Equipamento:</b> {selectedAvaria.equipamento?.nome || "Não informado"} ({selectedAvaria.equipamento?.nif || "Sem NIF"})</p>
              <p><b>Ambiente:</b> {selectedAvaria.sala?.nome || "N/A"}</p>
              <p><b>Relator:</b> {selectedAvaria.docente?.usuario?.nome || "Não informado"}</p>
              <p><b>Gravidade:</b> {selectedAvaria.gravidade || "MEDIA"}</p>

              <div>
                <b>Descrição:</b>
                <p style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", marginTop: "4px", color: "#334155" }}>
                  {selectedAvaria.descricao}
                </p>
              </div>

              <div>
                <b style={{ display: "block", marginBottom: "6px" }}>Evidência em Foto:</b>
                {getImageUrl(selectedAvaria.foto) && !imageError ? (
                  <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", background: "#f1f5f9" }}>
                    <img
                      src={getImageUrl(selectedAvaria.foto)!}
                      alt="Evidência da avaria"
                      style={{ width: "100%", maxHeight: "240px", objectFit: "contain", display: "block" }}
                      onError={() => setImageError(true)}
                    />
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#94a3b8", fontStyle: "italic" }}>
                    Nenhuma imagem física encontrada no servidor para o caminho `{selectedAvaria.foto || "sem-foto.png"}`.
                  </p>
                )}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              <small style={{ color: "#64748b", display: "block", marginBottom: "10px", fontWeight: 600 }}>
                AÇÕES OPERACIONAIS (STATUS)
              </small>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="secondary-btn"
                  style={{
                    flex: 1,
                    padding: "8px",
                    fontSize: "13px",
                    opacity: isModalEmAnalise || isModalFinalizado ? 0.5 : 1,
                    cursor: isModalEmAnalise || isModalFinalizado ? "not-allowed" : "pointer",
                  }}
                  disabled={isModalEmAnalise || isModalFinalizado || updatingStatus}
                  onClick={() => handleUpdateStatusRequest(selectedAvaria.id_avaria, "EM_ANALISE")}
                >
                  Em Análise
                </button>
                <button
                  className="primary-btn"
                  style={{
                    flex: 1,
                    padding: "8px",
                    fontSize: "13px",
                    opacity: isModalFinalizado ? 0.5 : 1,
                    cursor: isModalFinalizado ? "not-allowed" : "pointer",
                  }}
                  disabled={isModalFinalizado || updatingStatus}
                  onClick={() => handleUpdateStatusRequest(selectedAvaria.id_avaria, "FINALIZADO")}
                >
                  Finalizar
                </button>
              </div>
              {isModalFinalizado && (
                <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Este chamado já foi finalizado e não pode mais retornar para Em análise.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Customizado de Confirmação */}
      {confirmFinalize && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px",
          }}
        >
          <div className="panel" style={{ width: "100%", maxWidth: "400px", background: "#fff", padding: "24px", borderRadius: "12px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <div style={{ marginBottom: "16px", color: "#dc2626" }}>
              <Icon name="info" size={48} />
            </div>
            <h3 style={{ marginBottom: "12px", color: "#0f172a", fontSize: "20px" }}>Confirmar Finalização</h3>
            <p style={{ marginBottom: "24px", color: "#475569", fontSize: "15px", lineHeight: "1.5" }}>
              Tem certeza que deseja finalizar este chamado? Esta ação indicará que o problema foi resolvido e não poderá ser revertida.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                className="secondary-btn"
                style={{ flex: 1, padding: "10px" }}
                onClick={() => setConfirmFinalize(null)}
                disabled={updatingStatus}
              >
                Cancelar
              </button>
              <button
                className="primary-btn"
                style={{ flex: 1, padding: "10px", backgroundColor: "#16a34a", borderColor: "#16a34a" }}
                onClick={() => executeStatusUpdate(confirmFinalize.id, confirmFinalize.status)}
                disabled={updatingStatus}
              >
                {updatingStatus ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}