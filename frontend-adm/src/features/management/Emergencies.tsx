import { useState, useEffect } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { Icon } from "../../components/icons/Icon";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";

export function Emergencies({ notify }: { notify: (text: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [todasReservas, setTodasReservas] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);
  const [trocasSala, setTrocasSala] = useState<any[]>([]);
  const [handled, setHandled] = useState<number[]>([]);
  const [salasDestino, setSalasDestino] = useState<Record<number, string>>({});
  const [abaAtiva, setAbaAtiva] = useState<"PENDENTES" | "TODAS" | "TROCAS">("PENDENTES");

  const fetchDados = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    let failedRequests = 0;
    const fetchWithFallback = async (request: () => Promise<any>, alternatives: Array<() => Promise<any>>, fallback: any) => {
      try {
        return await request();
      } catch {
        for (const alternative of alternatives) {
          try {
            return await alternative();
          } catch {
            // Tenta a próxima rota compatível.
          }
        }
        failedRequests += 1;
        return fallback;
      }
    };
    try {
      const [pendentesRes, todasRes, salasRes, trocasRes] = await Promise.all([
        fetchWithFallback(() => api.get("/reservas/pendentes"), [], { data: null }),
        fetchWithFallback(() => api.get("/reservas"), [], { data: [] }),
        fetchWithFallback(() => api.get("/salas"), [], { data: [] }),
        fetchWithFallback(() => api.get("/trocas-sala"), [
          () => api.get("/troca-sala"),
          () => api.get("/troca-salas"),
        ], { data: [] }),
      ]);

      const listaTodas = Array.isArray(todasRes.data) ? todasRes.data : [];
      setTodasReservas(listaTodas);

      if (Array.isArray(pendentesRes.data)) {
        setRequests(pendentesRes.data);
      } else {
        setRequests(listaTodas.filter((r: any) => r.status === "PENDENTE"));
      }

      const listaSalas = Array.isArray(salasRes.data)
        ? salasRes.data
        : Array.isArray(salasRes.data?.salas)
        ? salasRes.data.salas
        : [];
      setSalas(listaSalas);

      const listaTrocas = Array.isArray(trocasRes.data)
        ? trocasRes.data
        : Array.isArray(trocasRes.data?.trocas)
        ? trocasRes.data.trocas
        : [];
      setTrocasSala(listaTrocas);
      if (manual) notify(failedRequests ? "Dados atualizados parcialmente. Algumas consultas falharam." : "Solicitações e trocas atualizadas.");
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setRequests([]);
      setTrocasSala([]);
      if (manual) notify("Não foi possível atualizar as solicitações.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, []);

  const formatarDataUTC = (dataIso?: string) => {
    if (!dataIso) return "";
    const d = new Date(dataIso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const extrairDataHorario = (reservaObj: any) => {
    const listaHorarios = Array.isArray(reservaObj?.reserva_horario)
      ? reservaObj.reserva_horario
      : [];

    if (listaHorarios.length === 0) {
      return reservaObj?.dt_solicitacao
        ? new Date(reservaObj.dt_solicitacao).toLocaleDateString("pt-BR")
        : "Hoje";
    }

    return listaHorarios
      .map((rh: any) => {
        const dataStr = formatarDataUTC(rh.dt_reserva);
        const h = rh.sala_horario?.horario;
        const inicio = h?.hora_inicio || h?.horario_inicio || "";
        const fim = h?.hora_fim || h?.horario_fim || "";
        const faixa = inicio && fim ? `${inicio} às ${fim}` : "";
        return [dataStr, faixa].filter(Boolean).join(" ");
      })
      .join(", ");
  };

  const extrairDocenteNome = (reservaObj: any) => {
    return (
      reservaObj?.reserva_docente?.[0]?.docente?.usuario?.nome ||
      reservaObj?.docente?.usuario?.nome ||
      reservaObj?.docente?.nome ||
      reservaObj?.usuario?.nome ||
      "Docente"
    );
  };

  const extrairTurmaNome = (reservaObj: any) => {
    return (
      reservaObj?.turma?.nome ||
      reservaObj?.turma?.codigo ||
      (reservaObj?.id_turma ? `Turma ${reservaObj.id_turma}` : "")
    );
  };

  const obterNomeSala = (idSala?: number, salaObj?: any) => {
    if (salaObj?.nome) return salaObj.nome;
    const encontrada = salas.find(
      (s: any) => Number(s.id_sala || s.id) === Number(idSala)
    );
    return encontrada?.nome || (idSala ? `Sala ID ${idSala}` : "Não informada");
  };

  const salaOcupadaNosHorarios = (idSalaCandidata: number, reservaOriginal: any) => {
    const horariosExigidos = Array.isArray(reservaOriginal?.reserva_horario)
      ? reservaOriginal.reserva_horario
      : [];

    if (horariosExigidos.length === 0) return false;

    return todasReservas.some((res: any) => {
      if (Number(res.id_sala) !== Number(idSalaCandidata)) return false;
      if (res.status !== "CONFIRMADA" && res.status !== "PENDENTE") return false;

      const horariosRes = Array.isArray(res.reserva_horario) ? res.reserva_horario : [];
      return horariosExigidos.some((hExigido: any) => {
        const dataExigida = formatarDataUTC(hExigido.dt_reserva);
        const idHorarioExigido = hExigido.sala_horario?.id_horario;

        return horariosRes.some((hExistente: any) => {
          const dataExistente = formatarDataUTC(hExistente.dt_reserva);
          const idHorarioExistente = hExistente.sala_horario?.id_horario;
          return dataExigida === dataExistente && idHorarioExigido === idHorarioExistente;
        });
      });
    });
  };

  const decide = async (reserva: any, acao: "APROVAR" | "RECUSAR") => {
    const idReserva = reserva.id_reserva;
    const protocol = `#RE-${idReserva}`;
    const isUrgencia = reserva.tipo === "URGENCIA";

    if (isUrgencia && acao === "APROVAR" && !salasDestino[idReserva]) {
      notify(`${protocol}: selecione a nova sala para realocar o docente atual.`);
      return;
    }

    const endpoint = isUrgencia
      ? `/reservas/${idReserva}/decidir-urgencia`
      : `/reservas/${idReserva}/decidir`;

    const payload: Record<string, any> = {
      aprovar: acao === "APROVAR",
    };

    if (isUrgencia && acao === "APROVAR") {
      payload.nova_sala_antiga = Number(salasDestino[idReserva]);
    }

    try {
      const response = await api.patch(endpoint, payload);
      setHandled((prev) => [...prev, idReserva]);
      notify(
        response?.data?.mensagem ||
          `${protocol}: solicitação ${acao === "APROVAR" ? "aprovada" : "recusada"} com sucesso.`
      );
      await fetchDados();
    } catch (error: any) {
      console.error("Erro ao decidir reserva:", error?.response?.data || error);
      const msgErro =
        error?.response?.data?.message || "Erro ao processar a requisição no servidor.";
      notify(`${protocol}: ${msgErro}`);
    }
  };

  const listaBase = abaAtiva === "PENDENTES" ? requests : todasReservas;

  const requestsOrdenados = [...listaBase].sort((a, b) => {
    if (a.status === "PENDENTE" && b.status !== "PENDENTE") return -1;
    if (a.status !== "PENDENTE" && b.status === "PENDENTE") return 1;
    const isAUrgencia = a.tipo === "URGENCIA";
    const isBUrgencia = b.tipo === "URGENCIA";
    if (isAUrgencia && !isBUrgencia) return -1;
    if (!isAUrgencia && isBUrgencia) return 1;
    return 0;
  });

  const trocasOrdenadas = [...trocasSala].sort((a, b) => {
    if (a.status === "PENDENTE" && b.status !== "PENDENTE") return -1;
    if (a.status !== "PENDENTE" && b.status === "PENDENTE") return 1;
    return Number(b.id_troca) - Number(a.id_troca);
  });

  const trocasPendentesCount = trocasSala.filter((t) => t.status === "PENDENTE").length;

  const obterEstiloStatusTroca = (status: string) => {
    switch (status) {
      case "ACEITA":
        return { bg: "#dcfce7", color: "#15803d", label: "ACEITA (EFETIVADA)" };
      case "RECUSADA":
        return { bg: "#fee2e2", color: "#b91c1c", label: "RECUSADA" };
      case "CANCELADA":
        return { bg: "#f1f5f9", color: "#475569", label: "CANCELADA" };
      default:
        return { bg: "#fef3c7", color: "#b45309", label: "PENDENTE (ENTRE DOCENTES)" };
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="RESPOSTA OPERACIONAL"
        title="Aprovações e emergências"
        text="Analise conflitos, remanejamentos e acompanhe trocas de salas entre docentes."
        action={<RefreshButton refreshing={refreshing} onRefresh={() => void fetchDados(true)} />}
      />

      <div className="rule-banner" style={{ marginBottom: "16px" }}>
        <Icon name="alert" />
        <div>
          <b>Regra de emergência e permutas</b>
          <p>
            Priorize o plano de aula e uma sala equivalente. Trocas diretas entre docentes são
            confirmadas pelo titular da sala de destino e registradas abaixo para auditoria.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "18px" }}>
        <button
          type="button"
          onClick={() => setAbaAtiva("PENDENTES")}
          style={{
            padding: "6px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: 1.4,
            cursor: "pointer",
            border: abaAtiva === "PENDENTES" ? "1px solid #dc2626" : "1px solid #e2e8f0",
            backgroundColor: abaAtiva === "PENDENTES" ? "#fef2f2" : "#ffffff",
            color: abaAtiva === "PENDENTES" ? "#dc2626" : "#475569",
          }}
        >
          Pendentes ({requests.length})
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("TODAS")}
          style={{
            padding: "6px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: 1.4,
            cursor: "pointer",
            border: abaAtiva === "TODAS" ? "1px solid #dc2626" : "1px solid #e2e8f0",
            backgroundColor: abaAtiva === "TODAS" ? "#fef2f2" : "#ffffff",
            color: abaAtiva === "TODAS" ? "#dc2626" : "#475569",
          }}
        >
          Todas as reservas ({todasReservas.length})
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("TROCAS")}
          style={{
            padding: "6px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            lineHeight: 1.4,
            cursor: "pointer",
            border: abaAtiva === "TROCAS" ? "1px solid #dc2626" : "1px solid #e2e8f0",
            backgroundColor: abaAtiva === "TROCAS" ? "#fef2f2" : "#ffffff",
            color: abaAtiva === "TROCAS" ? "#dc2626" : "#475569",
          }}
        >
          Trocas de Sala ({trocasSala.length})
          {trocasPendentesCount > 0 ? ` • ${trocasPendentesCount} pendente(s)` : ""}
        </button>
      </div>

      <div className="request-list" style={{ alignItems: "start" }}>
        {loading ? (
          <p style={{ padding: 20 }}>Carregando solicitações...</p>
        ) : abaAtiva === "TROCAS" ? (
          trocasOrdenadas.length > 0 ? (
            trocasOrdenadas.map((t) => {
              const protocol = `#TR-${t.id_troca}`;
              const reservaVinculada =
                todasReservas.find(
                  (res) => Number(res.id_reserva) === Number(t.id_reserva)
                ) || t.reserva;

              const salaOrigemNome = obterNomeSala(t.id_sala_origem, t.sala_origem);
              const salaDestinoNome = obterNomeSala(t.id_sala_destino, t.sala_destino);
              const solicitanteNome =
                t.docente_solicitante?.usuario?.nome ||
                extrairDocenteNome(reservaVinculada);
              const turmaNome = extrairTurmaNome(reservaVinculada);
              const dataHorario = reservaVinculada
                ? extrairDataHorario(reservaVinculada)
                : formatarDataUTC(t.dt_troca);
              const statusBadge = obterEstiloStatusTroca(t.status);

              return (
                <article className="panel request" key={`troca-${t.id_troca}`}>
                  <div
                    className="request-top"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span className="protocol">{protocol}</span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "999px",
                        backgroundColor: statusBadge.bg,
                        color: statusBadge.color,
                      }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>

                  <h2>
                    Permuta de Sala • Reserva #{t.id_reserva}
                  </h2>
                  <p>
                    {[solicitanteNome, turmaNome, dataHorario].filter(Boolean).join(" • ")}
                  </p>

                  <div className="allocation" style={{ marginBottom: "10px" }}>
                    <div>
                      <small>SALA DE ORIGEM</small>
                      <b>{salaOrigemNome}</b>
                    </div>
                    <Icon name="arrow" />
                    <div>
                      <small>SALA DE DESTINO</small>
                      <b>{salaDestinoNome}</b>
                    </div>
                  </div>

                  {t.motivo && (
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      <b>Motivo:</b> {t.motivo}
                    </div>
                  )}

                  <small style={{ display: "block", color: "#64748b", fontSize: "11px" }}>
                    {t.status === "PENDENTE"
                      ? "Aguardando resposta do docente titular da sala de destino."
                      : t.status === "ACEITA"
                      ? "As salas das duas reservas foram permutadas automaticamente no sistema."
                      : `Solicitação encerrada com status: ${t.status}.`}
                  </small>
                </article>
              );
            })
          ) : (
            <article className="panel request" style={{ padding: 30, textAlign: "center" }}>
              <p>Nenhuma solicitação de troca de sala registrada.</p>
            </article>
          )
        ) : requestsOrdenados.length > 0 ? (
          requestsOrdenados.map((r) => {
            const protocol = `#RE-${r.id_reserva}`;
            const isHandled = handled.includes(r.id_reserva);
            const isPendente = r.status === "PENDENTE";
            const isUrgencia = r.tipo === "URGENCIA";

            const salaNome = r.sala?.nome || `Sala ID ${r.id_sala}`;
            const docenteNome = extrairDocenteNome(r);
            const turmaNome = extrairTurmaNome(r);

            const trocaEmAndamento = trocasSala.find(
              (t) =>
                Number(t.id_reserva) === Number(r.id_reserva) && t.status === "PENDENTE"
            );

            const reservaOcupante = isUrgencia
              ? todasReservas.find(
                  (res) => Number(res.id_reserva) === Number(r.id_reserva_urgencia)
                )
              : null;

            const dataHorario = extrairDataHorario(
              isUrgencia && reservaOcupante ? reservaOcupante : r
            );

            const salasCandidatas = salas.filter(
              (s: any) => s.ativa !== false && Number(s.id_sala || s.id) !== Number(r.id_sala)
            );

            return (
              <article
                className={`panel request ${isHandled ? "handled" : ""}`}
                key={r.id_reserva}
              >
                <div className="request-top">
                  <span className="protocol">{protocol}</span>
                </div>

                <h2>
                  Solicitação de Reserva #{r.id_reserva} ({r.tipo || "NORMAL"})
                </h2>
                <p>{[docenteNome, turmaNome, dataHorario].filter(Boolean).join(" • ")}</p>

                {trocaEmAndamento && (
                  <div
                    style={{
                      marginBottom: "10px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      backgroundColor: "#fef3c7",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    Atenção: existe uma troca de sala pendente (#TR-{trocaEmAndamento.id_troca})
                    para esta reserva.
                  </div>
                )}

                <div
                  className="allocation"
                  style={isUrgencia && isPendente ? { marginBottom: "10px" } : undefined}
                >
                  <div>
                    <small>SALA SOLICITADA</small>
                    <b>{salaNome}</b>
                  </div>
                  <Icon name="arrow" />
                  <div>
                    <small>STATUS ATUAL</small>
                    <b>{r.status}</b>
                  </div>
                </div>

                {isUrgencia && isPendente && (
                  <div style={{ marginBottom: "12px" }}>
                    <small
                      style={{
                        display: "block",
                        color: "#64748b",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        marginBottom: "4px",
                      }}
                    >
                      REALOCAR{" "}
                      {reservaOcupante
                        ? extrairDocenteNome(reservaOcupante).toUpperCase()
                        : "DOCENTE ATUAL"}{" "}
                      PARA:
                    </small>
                    <select
                      value={salasDestino[r.id_reserva] || ""}
                      onChange={(e) =>
                        setSalasDestino((prev) => ({
                          ...prev,
                          [r.id_reserva]: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        height: "34px",
                        padding: "0 10px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                        lineHeight: "34px",
                        backgroundColor: "#f8fafc",
                        color: "#0f172a",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="">Selecione a nova sala...</option>
                      {salasCandidatas.map((s: any) => {
                        const sId = Number(s.id_sala || s.id);
                        const ocupada = reservaOcupante
                          ? salaOcupadaNosHorarios(sId, reservaOcupante)
                          : false;

                        return (
                          <option key={sId} value={sId}>
                            {s.nome}
                            {ocupada ? " (Ocupada neste horário)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {isPendente && (
                  <div className="request-actions">
                    <button
                      className="secondary-btn"
                      disabled={isHandled}
                      onClick={() => decide(r, "RECUSAR")}
                    >
                      Recusar
                    </button>
                    <button
                      className="primary-btn"
                      disabled={isHandled || (isUrgencia && !salasDestino[r.id_reserva])}
                      onClick={() => decide(r, "APROVAR")}
                      title={
                        isUrgencia && !salasDestino[r.id_reserva]
                          ? "Selecione a nova sala para realocar o docente atual"
                          : ""
                      }
                    >
                      {isUrgencia ? "Aprovar e realocar" : "Aprovar e notificar"}
                    </button>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <article className="panel request" style={{ padding: 30, textAlign: "center" }}>
            <p>
              {abaAtiva === "PENDENTES"
                ? "Nenhuma solicitação pendente no momento."
                : "Nenhuma reserva encontrada."}
            </p>
          </article>
        )}
      </div>
    </>
  );
}