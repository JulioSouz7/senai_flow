import { useEffect, useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";
import { calculateWeeklyUsage, formatUsage, WEEKLY_LIMIT } from "./reservationUsage";

type Horario = { hora_inicio: string; hora_fim: string };
type SalaHorario = {
  id_sala_horario: number;
  dia_semana: number;
  ativo: boolean;
  horario: Horario;
};
type SalaAPI = {
  id_sala: number;
  nome: string;
  capacidade: number;
  foto: string | null;
  predio?: { nome?: string };
  horarios_disponiveis?: SalaHorario[];
};
type TurmaAPI = { id_turma: number; nome: string; curso: string };
type ReservaUsage = {
  status?: string;
  reserva_horario?: Array<{ dt_reserva?: string }>;
};

const DIAS_SEMANA_NOME: Record<number, string> = {
  0: "Domingo", 1: "Segunda-feira", 2: "Terça-feira", 3: "Quarta-feira",
  4: "Quinta-feira", 5: "Sexta-feira", 6: "Sábado", 7: "Domingo",
};

function errorMessage(error: unknown): string {
  const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
  return message || (error instanceof Error ? error.message : "Não foi possível concluir a operação.");
}

function Reservations({
  go,
  notify,
}: {
  go: (n: number) => void;
  notify: (message: string, kind?: "success" | "error" | "warning" | "info") => void;
}) {
  const [salas, setSalas] = useState<SalaAPI[]>([]);
  const [turmas, setTurmas] = useState<TurmaAPI[]>([]);
  const [selectedTurmaId, setSelectedTurmaId] = useState<number | null>(null);
  const [usageReservations, setUsageReservations] = useState<ReservaUsage[]>([]);
  const [selection, setSelection] = useState<{ sala: SalaAPI; slot: SalaHorario } | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [conflictWarning, setConflictWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoadingData(true);
    try {
      const [roomResponse, classResponse, reservationResponse] = await Promise.all([
        api.get<SalaAPI[]>("/salas"),
        api.get<TurmaAPI[]>("/turmas"),
        api.get<ReservaUsage[]>("/reservas/minhas-reservas"),
      ]);
      const rooms = Array.isArray(roomResponse.data) ? roomResponse.data : [];
      const classes = Array.isArray(classResponse.data) ? classResponse.data : [];
      const reservations = Array.isArray(reservationResponse.data) ? reservationResponse.data : [];
      setSalas(rooms);
      setTurmas(classes);
      setSelectedTurmaId((current) =>
        current !== null && classes.some((item) => item.id_turma === current)
          ? current
          : classes[0]?.id_turma ?? null
      );
      setUsageReservations(reservations);
      if (manual) notify("Agenda e utilização semanal atualizadas.", "success");
    } catch (error: unknown) {
      console.error("Erro ao carregar a agenda:", error);
      notify(errorMessage(error), "error");
    } finally {
      if (manual) setRefreshing(false);
      else setLoadingData(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const weeklyUsage = calculateWeeklyUsage(usageReservations, selectedDate || new Date());

  const openModal = (sala: SalaAPI, slot: SalaHorario) => {
    setSelection({ sala, slot });
    setSelectedDate("");
    setJustificativa("");
    setConflictWarning(false);
  };

  const closeModal = () => {
    setSelection(null);
    setSelectedDate("");
    setJustificativa("");
    setConflictWarning(false);
  };

  const validateSelection = () => {
    if (!selection || !selectedDate) {
      notify("Selecione uma data para realizar a reserva.", "warning");
      return false;
    }
    if (selectedTurmaId === null) {
      notify("Seu perfil não possui uma turma vinculada para solicitar a reserva.", "warning");
      return false;
    }
    const [year, month, day] = selectedDate.split("-").map(Number);
    const pickedWeekDay = new Date(year, month - 1, day).getDay();
    if (pickedWeekDay !== Number(selection.slot.dia_semana)) {
      notify(`A data selecionada não é uma ${DIAS_SEMANA_NOME[selection.slot.dia_semana]}. Escolha uma data correspondente.`, "warning");
      return false;
    }
    return true;
  };

  const submitReservation = async () => {
    if (!validateSelection() || !selection) return;
    setLoading(true);
    try {
      await api.post("/reservas", {
        id_sala: selection.sala.id_sala,
        id_turma: selectedTurmaId,
        horarios: [{ id_sala_horario: selection.slot.id_sala_horario, dt_reserva: selectedDate }],
      });
      notify("Solicitação de reserva enviada com sucesso!", "success");
      closeModal();
      go(1);
    } catch (error) {
      const message = errorMessage(error);
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 409 && message.toLowerCase().includes("reserva confirmada")) {
        setConflictWarning(true);
      } else {
        notify(message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const submitEmergency = async () => {
    if (!validateSelection() || !selection) return;
    if (justificativa.trim().length < 10) {
      notify("Informe uma justificativa de urgência com pelo menos 10 caracteres.", "warning");
      return;
    }
    setLoading(true);
    try {
      await api.post("/reservas/urgencia", {
        id_sala: selection.sala.id_sala,
        id_turma: selectedTurmaId,
        justificativa_urgencia: justificativa.trim(),
        horarios: [{ id_sala_horario: selection.slot.id_sala_horario, dt_reserva: selectedDate }],
      });
      notify("Solicitação de reserva de emergência enviada com sucesso! Aguardando aprovação.", "success");
      closeModal();
      go(1);
    } catch (error) {
      notify(errorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const remaining = Math.max(0, WEEKLY_LIMIT - weeklyUsage);

  return (
    <>
      <PageTitle
        eyebrow="AGENDA DE ESPAÇOS"
        title="Reserva de salas"
        text="Solicitações regulares exigem 48h de antecedência e respeitam o limite de 10h semanais."
        action={<RefreshButton label="agenda" refreshing={refreshing} onRefresh={() => void loadData(true)} />}
      />

      {turmas.length > 1 && (
        <label className="reservation-class-picker">
          Turma da reserva
          <select value={selectedTurmaId ?? ""} onChange={(event) => setSelectedTurmaId(Number(event.target.value))}>
            {turmas.map((turma) => <option key={turma.id_turma} value={turma.id_turma}>{turma.nome}</option>)}
          </select>
        </label>
      )}

      <div className="quota">
        <div>
          <span>Uso semanal</span>
          <b>{formatUsage(weeklyUsage)} de {formatUsage(WEEKLY_LIMIT)}</b>
        </div>
        <div><i style={{ width: `${Math.min(weeklyUsage / WEEKLY_LIMIT * 100, 100)}%` }} /></div>
        <p>Restam {formatUsage(remaining)} na semana selecionada.</p>
      </div>

      {loadingData ? (
        <p className="panel" style={{ padding: 20 }}>Carregando salas, turmas e utilização semanal...</p>
      ) : salas.length === 0 ? (
        <p className="panel" style={{ padding: 20 }}>Nenhuma sala disponível foi retornada pela API.</p>
      ) : (
        <div className="rooms-feed">
          {salas.map((sala) => (
            <article key={sala.id_sala} className="panel room-card">
              <div>
                <h3>{sala.nome}</h3>
                <p>{sala.predio?.nome ? `${sala.predio.nome} • ` : ""}{sala.capacidade} lugares</p>
              </div>
              <div className="room-slots">
                {(sala.horarios_disponiveis ?? []).filter((slot) => slot.ativo).map((slot) => (
                  <button type="button" key={slot.id_sala_horario} onClick={() => openModal(sala, slot)}>
                    <Icon name="building" size={15} />
                    <span><strong>{DIAS_SEMANA_NOME[slot.dia_semana]}</strong>: {slot.horario.hora_inicio}–{slot.horario.hora_fim}</span>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}

      {selection && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal room-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal} aria-label="Fechar">×</button>
            {selection.sala.foto ? (
              <div className="room-image"><img src={selection.sala.foto} alt={selection.sala.nome} /></div>
            ) : null}
            <div className="room-info">
              <h2>{selection.sala.nome}</h2>
              <dl>
                <div><dt>PRÉDIO</dt><dd>{selection.sala.predio?.nome || "Não informado"}</dd></div>
                <div><dt>CAPACIDADE</dt><dd>{selection.sala.capacidade} lugares</dd></div>
                <div><dt>HORÁRIO</dt><dd>{selection.slot.horario.hora_inicio} às {selection.slot.horario.hora_fim}</dd></div>
                <div className="reservation-date"><label htmlFor="reservation-date">ESCOLHA A DATA DA RESERVA</label>
                  <input id="reservation-date" type="date" value={selectedDate} onChange={(event) => {
                    setSelectedDate(event.target.value);
                    setConflictWarning(false);
                  }} />
                </div>
                {turmas.length > 1 && (
                  <div className="reservation-date">
                    <label htmlFor="reservation-class">TURMA</label>
                    <select id="reservation-class" value={selectedTurmaId ?? ""} onChange={(event) => setSelectedTurmaId(Number(event.target.value))}>
                      {turmas.map((turma) => <option key={turma.id_turma} value={turma.id_turma}>{turma.nome}</option>)}
                    </select>
                  </div>
                )}
              </dl>
              {conflictWarning && (
                <div className="reservation-conflict">
                  <p>Existe uma reserva confirmada para esta data e horário. Você pode solicitar uma reserva de emergência.</p>
                  <label htmlFor="emergency-reason">Justificativa (mínimo 10 caracteres)</label>
                  <input id="emergency-reason" maxLength={255} value={justificativa} onChange={(event) => setJustificativa(event.target.value)} />
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" onClick={closeModal} disabled={loading}>Fechar</button>
              {conflictWarning ? (
                <button className="primary-btn" type="button" onClick={submitEmergency} disabled={loading || justificativa.trim().length < 10}>
                  {loading ? "Enviando..." : "Solicitar emergência"}
                </button>
              ) : (
                <button className="primary-btn" type="button" onClick={submitReservation} disabled={loading || !selectedDate}>
                  {loading ? "Enviando..." : "Solicitar reserva"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Reservations;
