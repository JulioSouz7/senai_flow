import { useEffect, useState } from "react";

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
  status: string;
  sala?: Sala | null;
  reserva_horario?: ReservaHorario | ReservaHorario[];
  reservaHorario?: ReservaHorario | ReservaHorario[];
}

interface SolicitacaoTroca {
  id_troca: number;
  id_reserva_origem: number;
  id_reserva_destino: number;
  status: string;
  motivo?: string;
  dt_solicitacao?: string;
  docente_solicitante?: {
    nome?: string;
    usuario?: { nome: string };
  };
  reserva_origem?: Reserva;
  reserva_destino?: Reserva;
}

export default function Swaps({ notify }: { notify: (x: string) => void }) {
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([]);
  const [outrasReservas, setOutrasReservas] = useState<Reserva[]>([]);
  const [solicitacoesRecebidas, setSolicitacoesRecebidas] = useState<SolicitacaoTroca[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados do formulário de Proposta
  const [reservaOrigem, setReservaOrigem] = useState<string>("");
  const [reservaDestino, setReservaDestino] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [answeringId, setAnsweringId] = useState<number | null>(null);

  const fetchSwapsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("senai_token") || "";

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // 1. Executa as três consultas GET em paralelo
      const [resMinhas, resGeral, resTrocas] = await Promise.all([
        fetch("http://localhost:3001/reservas/minhas-reservas", { headers }),
        fetch("http://localhost:3001/reservas", { headers }),
        fetch("http://localhost:3001/trocas-sala", { headers }),
      ]);

      if (!resMinhas.ok || !resGeral.ok) {
        throw new Error("Falha ao carregar reservas da Central de Trocas.");
      }

      const dataMinhas: Reserva[] = await resMinhas.json();
      const dataGeral: Reserva[] = await resGeral.json();
      const dataTrocas = resTrocas.ok ? await resTrocas.json() : [];

      const safeMinhas = Array.isArray(dataMinhas) ? dataMinhas : [];
      const safeGeral = Array.isArray(dataGeral) ? dataGeral : [];
      const safeTrocas: SolicitacaoTroca[] = Array.isArray(dataTrocas) ? dataTrocas : [];

      // 1. Minhas reservas ativas para oferecer
      const minhasAtivas = safeMinhas.filter((r) => {
        const st = r.status ? String(r.status).trim().toUpperCase() : "";
        return st !== "ENCERRADA" && st !== "CANCELADA";
      });

      // 2. Todas as reservas ativas do sistema para receber
      const todasAtivas = safeGeral.filter((r) => {
        const st = r.status ? String(r.status).trim().toUpperCase() : "";
        return st !== "ENCERRADA" && st !== "CANCELADA";
      });

      // 3. Filtra apenas solicitações pendentes recebidas
      const pendentes = safeTrocas.filter((t) => {
        const st = t.status ? String(t.status).trim().toUpperCase() : "";
        return st === "PENDENTE" || st === "AGUARDANDO";
      });

      setMinhasReservas(minhasAtivas);
      setOutrasReservas(todasAtivas);
      setSolicitacoesRecebidas(pendentes);

      if (minhasAtivas.length > 0 && !reservaOrigem) setReservaOrigem(String(minhasAtivas[0].id_reserva));
      if (todasAtivas.length > 0 && !reservaDestino) setReservaDestino(String(todasAtivas[0].id_reserva));
    } catch (error) {
      console.error("Erro ao carregar dados de trocas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwapsData();
  }, []);

  // 2. Responder Solicitação de Troca (PATCH /trocas-sala/:id/responder)
  const handleResponderTroca = async (id_troca: number, novoStatus: "ACEITA" | "RECUSADA") => {
    try {
      setAnsweringId(id_troca);
      const token = localStorage.getItem("senai_token") || "";

      const response = await fetch(`http://localhost:3001/trocas-sala/${id_troca}/responder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (response.ok) {
        notify(`Solicitação de troca ${novoStatus === "ACEITA" ? "aceita" : "recusada"} com sucesso!`);
        fetchSwapsData();
      } else {
        const errorData = await response.json();
        notify(`Erro ao responder troca: ${errorData.message || "Falha na requisição"}`);
      }
    } catch (error) {
      console.error("Erro ao responder troca:", error);
      notify("Erro de conexão ao responder solicitação de troca.");
    } finally {
      setAnsweringId(null);
    }
  };

  // 3. Enviar proposta de troca (POST /trocas-sala)
  const handleEnviarProposta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reservaOrigem || !reservaDestino) {
      notify("Selecione ambas as reservas para propor a troca.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("senai_token") || "";

      const response = await fetch("http://localhost:3001/trocas-sala", {
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
        notify("Proposta de troca enviada com sucesso!");
        setMotivo("");
        fetchSwapsData();
      } else {
        const errorData = await response.json();
        notify(`Erro ao enviar: ${errorData.message || "Falha na requisição"}`);
      }
    } catch (error) {
      console.error("Erro ao enviar proposta:", error);
      notify("Erro de conexão ao enviar proposta de troca.");
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
        <small style={{ color: "#e30613", fontWeight: 700, letterSpacing: "0.5px" }}>
          NEGOCIAÇÃO ENTRE DOCENTES
        </small>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "4px 0 2px 0", color: "#1e293b" }}>
          Central de trocas
        </h2>
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

                const idOrigem = item.id_reserva_origem || item.id_reserva;
                const idDestino = item.id_reserva_destino;

                const objOrigem =
                  item.reserva_origem ||
                  outrasReservas.find((r) => r.id_reserva === idOrigem) ||
                  minhasReservas.find((r) => r.id_reserva === idOrigem);

                const objDestino =
                  item.reserva_destino ||
                  minhasReservas.find((r) => r.id_reserva === idDestino) ||
                  outrasReservas.find((r) => r.id_reserva === idDestino);

                const nomeSalaOrigem =
                  item.sala_origem?.nome ||
                  objOrigem?.sala?.nome ||
                  (idOrigem ? `Reserva #${idOrigem}` : "Sala não informada");

                const nomeSalaDestino =
                  item.sala_destino?.nome ||
                  objDestino?.sala?.nome ||
                  (idDestino ? `Reserva #${idDestino}` : "Sala não informada");

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
                        <b>Deseja receber:</b> {nomeSalaDestino} {idDestino ? `(ID: ${idDestino})` : ""}
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