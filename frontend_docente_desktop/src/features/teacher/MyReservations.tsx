import { useEffect, useState } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { RefreshButton } from "../../components/ui/RefreshButton";
import Checklist from "./Checklist";
import Swaps from "./Swaps";

interface Sala {
  id_sala: number;
  nome: string;
}

interface Turma {
  id_turma: number;
  nome: string;
}

interface ReservaHorario {
  dt_reserva?: string;
  hora_inicio?: string;
  hora_fim?: string;
  sala_horario?: { horario?: { hora_inicio?: string; hora_fim?: string } };
}

interface Reserva {
  id_reserva: number;
  status: string;
  dt_solicitacao?: string;
  sala?: Sala | null;
  turma?: Turma | null;
  reserva_horario?: ReservaHorario | ReservaHorario[];
  reservaHorario?: ReservaHorario | ReservaHorario[];
}

function institutionalDateTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function MyReservations({
  notify,
}: {
  notify: (message: string, kind?: "success" | "error" | "warning" | "info") => void;
}) {
  const [checklist, setChecklist] = useState(false);
  
  // ALTERAÇÃO: Agora guardamos o objeto da reserva inteiro
  const [reservaAtiva, setReservaAtiva] = useState<Reserva | null>(null);
  
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<{ id: number; sala: string } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    async function fetchReservas() {
      try {
        setLoading(true);
        const token = localStorage.getItem("senai_token") || "";

        if (!token) {
          notify("Sessão não encontrada. Faça login novamente.", "warning");
          setLoading(false);
          return;
        }

        const url = "http://localhost:3001/reservas/minhas-reservas";
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar as reservas.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          setReservas([]);
          return;
        }

        const dataNormalizada = data.map((item: any) => ({
          ...item,
          id_reserva: item.id_reserva || item.id,
        }));

        const ativas = dataNormalizada.filter((r) => {
          const st = r.status ? String(r.status).trim().toUpperCase() : "";
          return st !== "ENCERRADA" && st !== "CANCELADA";
        });

        setReservas(ativas);
      } catch (error) {
        console.error("Erro no fetch de reservas:", error);
        notify("Falha ao carregar suas reservas.", "error");
      } finally {
        setLoading(false);
      }
    }

    fetchReservas();
  }, [notify]);

  const refreshReservations = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setLoading(true);
    try {
      const token = localStorage.getItem("senai_token") || "";
      if (!token) {
        notify("Sessão não encontrada. Faça login novamente.", "warning");
        return;
      }

      const response = await fetch("http://localhost:3001/reservas/minhas-reservas", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Não foi possível carregar suas reservas.");
      }

      const data = await response.json();
      const normalized = Array.isArray(data)
        ? data.map((item: any) => ({ ...item, id_reserva: item.id_reserva || item.id }))
        : [];
      setReservas(normalized.filter((reserva) => {
        const status = String(reserva.status ?? "").trim().toUpperCase();
        return status !== "ENCERRADA" && status !== "CANCELADA";
      }));
      notify("Reservas atualizadas.", "success");
    } catch (error) {
      console.error("Erro ao atualizar reservas:", error);
      notify(error instanceof Error ? error.message : "Não foi possível atualizar suas reservas.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setCurrentTime(Date.now());
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const executarCancelamento = async (id_reserva: number, salaNome: string) => {
    try {
      const token = localStorage.getItem("senai_token") || "";
      const response = await fetch(`http://localhost:3001/reservas/${id_reserva}/cancelar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        notify(`Reserva na ${salaNome} cancelada com sucesso.`, "success");
        setReservas((prev) => prev.filter((item) => item.id_reserva !== id_reserva));
      } else {
        const errorData = await response.json();
        notify(`Erro ao cancelar: ${errorData.message || "Falha na API"}`, "error");
      }
    } catch (err) {
      console.error("Erro ao cancelar reserva:", err);
      notify("Erro de conexão ao cancelar a reserva.", "error");
    }
  };

  const handleCancelarReserva = (id_reserva: number, salaNome: string) => {
    setPendingCancel({ id: id_reserva, sala: salaNome });
  };

  // ALTERAÇÃO: Passa a reserva completa
  const handleAbrirChecklist = (reserva: Reserva) => {
    setReservaAtiva(reserva);
    setChecklist(true);
  };

  const isWithinUsageWindow = (reserva: Reserva): boolean => {
    const relation = reserva.reserva_horario || reserva.reservaHorario;
    const slots = Array.isArray(relation) ? relation : relation ? [relation] : [];
    const nowAtCampus = institutionalDateTime(new Date(currentTime));
    return slots.some((slot) => {
      if (!slot.dt_reserva) return false;
      const start = slot.sala_horario?.horario?.hora_inicio || slot.hora_inicio;
      const end = slot.sala_horario?.horario?.hora_fim || slot.hora_fim;
      if (!start || !end) return false;
      const date = slot.dt_reserva.split("T")[0];
      const begins = `${date}T${start.slice(0, 5)}`;
      const finishes = `${date}T${end.slice(0, 5)}`;
      return nowAtCampus >= begins && nowAtCampus <= finishes;
    });
  };

  const handleConfirmarChecklist = async (dadosChecklist: any) => {
    if (!reservaAtiva) return;
    
    const salaNome = reservaAtiva.sala?.nome || "Sala";
    notify(`Finalizando reserva na ${salaNome}...`, "info");

    try {
      const token = localStorage.getItem("senai_token") || "";
      const response = await fetch(`http://localhost:3001/reservas/${reservaAtiva.id_reserva}/encerrar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sala_em_ordem: dadosChecklist.sala_em_ordem ?? true,
          houve_avaria: dadosChecklist.houve_avaria ?? false,
          obs_encerramento: dadosChecklist.observacoes || "Encerrado via painel docente com checklist.",
        }),
      });

      if (response.ok) {
        notify(`Reserva na ${salaNome} encerrada com sucesso!`, "success");
        // Remove da lista
        setReservas((prev) => prev.filter((item) => item.id_reserva !== reservaAtiva.id_reserva));
        
        // ALTERAÇÃO: Retorna à tela principal após sucesso
        setChecklist(false);
        setReservaAtiva(null);
      } else {
        const errorData = await response.json();
        notify(`Erro ao encerrar: ${errorData.message || "Falha na API"}`, "error");
      }
    } catch (err) {
      console.error("Erro ao encerrar reserva:", err);
      notify("Erro de conexão ao encerrar a reserva.", "error");
    }
  };

  if (checklist && reservaAtiva)
    return (
      <>
        <button
          className="text-link back-link"
          onClick={() => {
            setChecklist(false);
            setReservaAtiva(null);
          }}
        >
          ← Voltar às reservas
        </button>

        {/* ALTERAÇÃO: Passando a reserva inteira via prop */}
        <Checklist 
           notify={notify} 
           onConfirm={handleConfirmarChecklist} 
           reserva={reservaAtiva} 
        />
      </>
    );

  return (
    <>
      <PageTitle
        eyebrow="AGENDA DOCENTE"
        title="Minhas reservas"
        text="Acompanhe validações, horários e solicitações de troca."
        action={<RefreshButton label="reservas" refreshing={refreshing} onRefresh={() => void refreshReservations()} />}
      />

      {loading ? (
        <p style={{ padding: "20px" }}>A carregar reservas...</p>
      ) : (
        <div className="reservation-list">
          {reservas.length === 0 ? (
            <p style={{ padding: "20px" }}>Nenhuma reserva ativa encontrada.</p>
          ) : (
            reservas.map((r) => {
              const relacaoHorario = r.reserva_horario || r.reservaHorario;
              const horarioObj = Array.isArray(relacaoHorario)
                ? relacaoHorario[0]
                : relacaoHorario;

              const dataBruta = horarioObj?.dt_reserva || r.dt_solicitacao;
              let dataFormatada = "SEM DATA";
              if (dataBruta) {
                const partes = dataBruta.split("T")[0].split("-");
                if (partes.length === 3) {
                  const dataObj = new Date(
                    Number(partes[0]),
                    Number(partes[1]) - 1,
                    Number(partes[2])
                  );
                  dataFormatada = dataObj
                    .toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })
                    .toUpperCase();
                } else {
                  dataFormatada = new Date(dataBruta)
                    .toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })
                    .toUpperCase();
                }
              }

              const salaNome = r.sala?.nome || "Sala Indefinida";
              const turmaNome = r.turma?.nome ? ` • ${r.turma.nome}` : "";
              
              const statusUpper = r.status?.toUpperCase();
              const isConfirmada = statusUpper === "CONFIRMADA" || statusUpper === "APROVADA";
              const isCancelable = statusUpper === "PENDENTE" || statusUpper === "CONFIRMADA";
              const canFinishNow = isConfirmada && isWithinUsageWindow(r);

              return (
                <article className="panel" key={r.id_reserva}>
                  <span>{dataFormatada}</span>

                  <div>
                    <b>{salaNome}</b>
                    <p>
                      {horarioObj?.sala_horario?.horario?.hora_inicio || horarioObj?.hora_inicio || "Horário não informado"}
                      {horarioObj?.sala_horario?.horario?.hora_fim || horarioObj?.hora_fim
                        ? `–${horarioObj?.sala_horario?.horario?.hora_fim || horarioObj?.hora_fim}`
                        : ""}
                      {turmaNome}
                    </p>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: isConfirmada ? "#e6f4ea" : "#fef3c7",
                      color: isConfirmada ? "#137333" : "#854d0e",
                    }}
                  >
                    {r.status}
                  </span>

                  {isCancelable && (
                    <button
                      type="button"
                      style={{
                        padding: "8px 14px",
                        borderRadius: "6px",
                        backgroundColor: "#ffffff",
                        color: "#555555",
                        border: "1px solid #cccccc",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                      }}
                      onClick={() => handleCancelarReserva(r.id_reserva, salaNome)}
                    >
                      Cancelar reserva
                    </button>
                  )}
                  {canFinishNow && (
                    <button
                      type="button"
                      style={{
                        padding: "8px 14px",
                        borderRadius: "6px",
                        backgroundColor: "#e30613",
                        color: "#ffffff",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onClick={() => handleAbrirChecklist(r)}
                    >
                      Encerrar reserva
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      <Swaps notify={notify} />
      {pendingCancel && (
        <div className="modal-overlay" onClick={() => setPendingCancel(null)}>
          <div className="app-confirm" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>Cancelar reserva</h2>
            <p>Deseja realmente cancelar a reserva na {pendingCancel.sala}?</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setPendingCancel(null)}>Voltar</button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  const cancellation = pendingCancel;
                  setPendingCancel(null);
                  void executarCancelamento(cancellation.id, cancellation.sala);
                }}
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MyReservations;