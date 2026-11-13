import { useCallback, useEffect, useState } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { api } from "../../services/api";
import { RefreshButton } from "../../components/ui/RefreshButton";

interface Comunicado {
  id_comunicado: number;
  titulo: string;
  conteudo: string;
  abrangencia: string;
  dt_publicacao?: string;
  administrador?: { usuario?: { nome?: string } };
  reserva?: { sala?: { nome: string } };
}

function Notifications({
  notify,
}: {
  notify: (message: string, kind?: "success" | "error" | "warning" | "info") => void;
}) {
  const [comunicadosGerais, setComunicadosGerais] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnnouncements = useCallback(async (manual = false) => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get<Comunicado[]>("/comunicados");
      setComunicadosGerais(Array.isArray(data) ? data.filter((item) => item.abrangencia === "GERAL") : []);
      if (manual) notify("Comunicados atualizados.", "success");
    } catch (requestError) {
      console.error("Erro na requisição de comunicados gerais:", requestError);
      const responseMessage = requestError && typeof requestError === "object" && "response" in requestError
        ? (requestError as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      const message = responseMessage || "Não foi possível carregar os comunicados gerais.";
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  const renderCard = (item: Comunicado) => {
    const data = item.dt_publicacao ? new Date(item.dt_publicacao) : null;
    const dataStr = data && !Number.isNaN(data.getTime())
      ? data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
      : "";

    return (
      <article
        key={item.id_comunicado}
        className="panel"
        style={{
          padding: "20px",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          marginBottom: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            {item.titulo || "Comunicado sem título"}
          </h3>
          {dataStr && (
            <time style={{ fontSize: "0.8rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
              {dataStr}
            </time>
          )}
        </div>
        <p style={{ color: "#334155", fontSize: "0.92rem", lineHeight: "1.5", margin: "0 0 12px 0" }}>
          {item.conteudo || ""}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
          <span>
            <b>Enviado por:</b> {item.administrador?.usuario?.nome || "Coordenação"}
          </span>
          {item.reserva?.sala?.nome && (
            <span style={{ backgroundColor: "#fee2e2", color: "#e30613", padding: "3px 8px", borderRadius: "4px", fontWeight: 700 }}>
              {item.reserva.sala.nome}
            </span>
          )}
        </div>
      </article>
    );
  };

  return (
    <div>
      <PageTitle
        eyebrow="QUADRO DE AVISOS"
        title="Comunicados"
        text="Acompanhe os avisos institucionais gerais destinados à comunidade docente e à instituição."
        action={<RefreshButton label="comunicados" refreshing={refreshing} onRefresh={() => {
          if (refreshing) return;
          setRefreshing(true);
          void loadAnnouncements(true).finally(() => setRefreshing(false));
        }} />}
      />
      {loading ? (
        <p style={{ padding: "20px", color: "#64748b" }}>Carregando comunicados...</p>
      ) : error ? (
        <p className="panel" role="alert" style={{ padding: "20px" }}>{error}</p>
      ) : (
        <section aria-labelledby="general-announcements-title" style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}>
            <h2 id="general-announcements-title" style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
              Comunicados Gerais ({comunicadosGerais.length})
            </h2>
          </div>
          {comunicadosGerais.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
              Nenhum comunicado geral disponível.
            </div>
          ) : (
            comunicadosGerais.map(renderCard)
          )}
        </section>
      )}
    </div>
  );
}

export default Notifications;
