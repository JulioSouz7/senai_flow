import { useCallback, useEffect, useState } from "react";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";

interface Sala {
  id_sala: number;
  nome: string;
}

interface ReservaHorario {
  dt_reserva?: string;
  hora_inicio?: string;
  hora_fim?: string;
}

interface Reserva {
  id_reserva: number;
  id_sala?: number;
  status: string;
  sala?: Sala | null;
  reserva_horario?: ReservaHorario | ReservaHorario[];
  reservaHorario?: ReservaHorario | ReservaHorario[];
}

interface SolicitacaoTroca {
  id_troca: number;
  id_reserva?: number;
  id_sala_destino?: number;
  status: string;
  motivo?: string;
  dt_solicitacao?: string;
  docente_solicitante?: {
    nome?: string;
    usuario?: { nome: string };
  };
  reserva?: Reserva;
  sala_origem?: Sala;
  sala_destino?: Sala;
}

export default function Swaps({ notify }: { notify: (message: string, kind?: "success" | "error" | "warning" | "info") => void }) {
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([]);
  const [outrasReservas, setOutrasReservas] = useState<Reserva[]>([]);
  const [solicitacoesRecebidas, setSolicitacoesRecebidas] = useState<SolicitacaoTroca[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados do formulário de Proposta
  const [reservaOrigem, setReservaOrigem] = useState<string>("");
  const [reservaDestino, setReservaDestino] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [answeringId, setAnsweringId] = useState<number | null>(null);

  const fetchSwapsData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("senai_token") || "";

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 1. Executa as três consultas GET em paralelo
      const [resMinhas, resGeral, resTrocas] = await Promise.all([
        fetch(`${api.defaults.baseURL}/reservas/minhas-reservas`, { headers }),
        fetch(`${api.defaults.baseURL}/reservas`, { headers }),
        fetch(`${api.defaults.baseURL}/trocas-sala`, { headers }),
      ]);

      if (!resMinhas.ok || !resGeral.ok || !resTrocas.ok) {
        throw new Error("Falha ao carregar reservas da Central de Trocas.");
      }

      const dataMinhas: Reserva[] = await resMinhas.json();
      const dataGeral: Reserva[] = await resGeral.json();
      const dataTrocas = resTrocas.ok ? await resTrocas.json() : [];

      const safeMinhas = Array.isArray(dataMinhas) ? dataMinhas : [];
      const safeGeral = Array.isArray(dataGeral) ? dataGeral : [];
      const safeTrocas: SolicitacaoTroca[] = Array.isArray(dataTrocas) ? dataTrocas : [];

      const minhasAtivas = safeMinhas.filter((r) => {
        const st = r.status ? String(r.status).trim().toUpperCase() : "";
        return !["ENCERRADA", "CANCELADA", "RECUSADA"].includes(st);
      });

      // EXTRAI OS IDs DAS MINHAS RESERVAS
      const meusIds = safeMinhas.map(r => r.id_reserva);

      const todasAtivas = safeGeral.filter((r) => {
        const st = r.status ? String(r.status).trim().toUpperCase() : "";
        const ativa = !["ENCERRADA", "CANCELADA", "RECUSADA"].includes(st);
        const naoEhMinha = !meusIds.includes(r.id_reserva);
        return ativa && naoEhMinha;
      });

      const minhasSalas = new Set(safeMinhas.map((reserva) => reserva.sala?.id_sala ?? reserva.id_sala).filter((id): id is number => typeof id === "number"));
      const pendentes = safeTrocas.filter((t) => {
        const st = t.status ? String(t.status).trim().toUpperCase() : "";
        return (st === "PENDENTE" || st === "AGUARDANDO")
          && typeof t.id_sala_destino === "number"
          && minhasSalas.has(t.id_sala_destino);
      });

      setMinhasReservas(minhasAtivas);
      setOutrasReservas(todasAtivas);
      setSolicitacoesRecebidas(pendentes);

      if (minhasAtivas.length > 0) setReservaOrigem((current) => current || String(minhasAtivas[0].id_reserva));
      if (todasAtivas.length > 0) setReservaDestino((current) => current || String(todasAtivas[0].id_reserva));
      return true;
    } catch (error) {
      console.error("Erro ao carregar dados de trocas:", error);
      notify(error instanceof Error ? error.message : "Não foi possível carregar as solicitações de troca.", "error");
      return false;
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void fetchSwapsData();
  }, [fetchSwapsData]);

  // 2. Responder Solicitação de Troca (PATCH /trocas-sala/:id/responder)
  const handleResponderTroca = async (id_troca: number, novoStatus: "ACEITA" | "RECUSADA") => {
    try {
      setAnsweringId(id_troca);
      const token = localStorage.getItem("senai_token") || "";

      const response = await fetch(`${api.defaults.baseURL}/trocas-sala/${id_troca}/responder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (response.ok) {
        notify(`Solicitação de troca ${novoStatus === "ACEITA" ? "aceita" : "recusada"} com sucesso!`, "success");
        await fetchSwapsData();
      } else {
        const errorData = await response.json();
        notify(`Erro ao responder troca: ${errorData.message || "Falha na requisição"}`, "error");
      }
    } catch (error) {
      console.error("Erro ao responder troca:", error);
      notify("Erro de conexão ao responder solicitação de troca.", "error");
    } finally {
      setAnsweringId(null);
    }
  };

  // 3. Enviar proposta de troca (POST /trocas-sala)
  const handleEnviarProposta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reservaOrigem || !reservaDestino) {
      notify("Selecione ambas as reservas para propor a troca.", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("senai_token") || "";

      const response = await fetch(`${api.defaults.baseURL}/trocas-sala`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_reserva_origem: Number(reservaOrigem),
          id_reserva_destino: Number(reservaDestino),
          motivo: motivo.trim() || "Necessidade de readequação de espaço de aula.",
        }),
      });

      if (response.ok) {
        notify("Proposta de troca enviada com sucesso!", "success");
        setMotivo("");
        await fetchSwapsData();
      } else {
        const errorData = await response.json();
        notify(`Erro ao enviar: ${errorData.message || "Falha na requisição"}`, "error");
      }
    } catch (error) {
      console.error("Erro ao enviar proposta:", error);
      notify("Erro de conexão ao enviar proposta de troca.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatOptionText = (r: Reserva) => {
    const salaNome = r.sala?.nome || "Sala Indefinida";
    const rel = r.reserva_horario || r.reservaHorario;
    const h = Array.isArray(rel) ? rel[0] : rel;
    const dt = h?.dt_reserva ? h.dt_reserva.split("T")[0] : "";
    return `${salaNome} • ID: ${r.id_reserva} ${dt ? `(${dt})` : ""}`;
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <div className="section-title" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <small style={{ color: "#e30613", fontWeight: 700, letterSpacing: "0.5px" }}>
              NEGOCIAÇÃO ENTRE DOCENTES
            </small>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "4px 0 2px 0", color: "#1e293b" }}>
              Central de trocas
            </h2>
          </div>
          <RefreshButton label="central de trocas" refreshing={refreshing} onRefresh={() => {
            if (refreshing) return;
            setRefreshing(true);
            void fetchSwapsData().then((loaded) => {
              if (loaded) notify("Central de trocas atualizada.");
            }).finally(() => setRefreshing(false));
          }} />
        </div>
        <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
          Aceite ou recuse solicitações recebidas ou proponha trocas de sala.
        </p>
      </div>

      <div className="swaps-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* CARD DA ESQUERDA: SOLICITAÇÃO RECEBIDA */}
        <article className="panel" style={{ padding: "24px", borderRadius: "12px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ color: "#e30613", fontSize: "0.75rem", fontWeight: 800 }}>NOVA SOLICITAÇÃO</span>
              <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Recebida recentemente</small>
            </div>

            {loading ? (
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Carregando solicitações...</p>
            ) : solicitacoesRecebidas.length === 0 ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#64748b" }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Nenhuma solicitação de troca pendente no momento.</p>
              </div>
            ) : (
              solicitacoesRecebidas.map((item: any) => {
                const nomeSolicitante =
                  item.docente_solicitante?.nome ||
                  item.docente_solicitante?.usuario?.nome ||
                  "Docente Solicitante";

                const idOrigem = item.id_reserva;

                const objOrigem =
                  item.reserva ||
                  outrasReservas.find((r) => r.id_reserva === idOrigem) ||
                  minhasReservas.find((r) => r.id_reserva === idOrigem);

                const nomeSalaOrigem =
                  item.sala_origem?.nome ||
                  objOrigem?.sala?.nome ||
                  (idOrigem ? `Reserva #${idOrigem}` : "Sala não informada");

                const nomeSalaDestino =
                  item.sala_destino?.nome ||
                  (item.id_sala_destino ? `Sala #${item.id_sala_destino}` : "Sala não informada");

                return (
                  <div key={item.id_troca} style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "#fee2e2",
                          color: "#e30613",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                        }}
                      >
                        {nomeSolicitante.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <b style={{ display: "block", fontSize: "0.95rem", color: "#0f172a" }}>
                          {nomeSolicitante}
                        </b>
                        <small style={{ color: "#64748b" }}>Solicitou uma troca de sala com você</small>
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #f1f5f9",
                        marginBottom: "16px",
                      }}
                    >
                      <p style={{ margin: "0 0 6px 0", fontSize: "0.85rem", color: "#334155" }}>
                        <b>Oferece:</b> {nomeSalaOrigem} {idOrigem ? `(ID: ${idOrigem})` : ""}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155" }}>
                        <b>Deseja receber:</b> {nomeSalaDestino}
                      </p>
                      {item.motivo && (
                        <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>
                          "{item.motivo}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        type="button"
                        disabled={answeringId === item.id_troca}
                        onClick={() => handleResponderTroca(item.id_troca, "RECUSADA")}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          backgroundColor: "#ffffff",
                          color: "#334155",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Recusar
                      </button>
                      <button
                        type="button"
                        disabled={answeringId === item.id_troca}
                        onClick={() => handleResponderTroca(item.id_troca, "ACEITA")}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: "#e30613",
                          color: "#ffffff",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {answeringId === item.id_troca ? "Processando..." : "Aceitar troca"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        {/* CARD DA DIREITA: ENVIAR PROPOSTA */}
        <form className="panel" onSubmit={handleEnviarProposta} style={{ padding: "24px", borderRadius: "12px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ color: "#e30613", fontSize: "0.75rem", fontWeight: 800 }}>ENVIAR PROPOSTA</span>
            <small style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Troca Direta</small>
          </div>

          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "20px" }}>Solicitar troca de sala</h3>

          {/* SELECT 1: SUA RESERVA QUE DESEJA OFERECER */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
              1. SUA RESERVA QUE DESEJA OFERECER
            </label>
            <select
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              value={reservaOrigem}
              onChange={(e) => setReservaOrigem(e.target.value)}
              disabled={loading}
            >
              {minhasReservas.length === 0 ? (
                <option value="">Nenhuma reserva sua disponível para oferecer</option>
              ) : (
                minhasReservas.map((r) => (
                  <option key={r.id_reserva} value={r.id_reserva}>
                    {formatOptionText(r)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* SELECT 2: SALA / RESERVA QUE DESEJA RECEBER */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
              2. SALA / RESERVA QUE DESEJA RECEBER
            </label>
            <select
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              value={reservaDestino}
              onChange={(e) => setReservaDestino(e.target.value)}
              disabled={loading}
            >
              {outrasReservas.length === 0 ? (
                <option value="">Nenhuma reserva de outro docente disponível</option>
              ) : (
                outrasReservas.map((r) => (
                  <option key={r.id_reserva} value={r.id_reserva}>
                    {formatOptionText(r)}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* MOTIVO DA TROCA */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
              3. MOTIVO DA SOLICITAÇÃO (OPCIONAL)
            </label>
            <input
              type="text"
              placeholder="Ex: Necessidade de laboratório equipado com computadores."
              style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || loading || minhasReservas.length === 0}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#e30613",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            {submitting ? "Enviando proposta..." : "Enviar proposta de troca"}
          </button>
        </form>
      </div>
    </div>
  );
}