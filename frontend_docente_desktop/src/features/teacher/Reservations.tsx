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
  sala_equipamento?: Array<{ equipamento?: { nome?: string } }>;
  equipamentos?: Array<{ nome?: string }>;
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
  const [detailsRoom, setDetailsRoom] = useState<SalaAPI | null>(null);
  const [selection, setSelection] = useState<{ sala: SalaAPI; slot: SalaHorario } | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [conflictWarning, setConflictWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchRoom, setSearchRoom] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [minimumCapacity, setMinimumCapacity] = useState("");
  const [filterDay, setFilterDay] = useState("");

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

  const openModal = (sala: SalaAPI) => {
    setDetailsRoom(sala);
    setSelection(null);
    setSelectedDate("");
    setJustificativa("");
    setConflictWarning(false);
  };

  const selectSlot = (slot: SalaHorario) => {
    if (!detailsRoom) return;
    setSelection({ sala: detailsRoom, slot });
    setSelectedDate("");
    setJustificativa("");
    setConflictWarning(false);
  };

  const closeModal = () => {
    setDetailsRoom(null);
    setSelection(null);
    setSelectedDate("");
    setJustificativa("");
    setConflictWarning(false);
  };

  const validateSelection = () => {
    if (!selection || !selectedDate) {
      notify("Selecione um horário e uma data para realizar a reserva.", "warning");
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
  const predios = [...new Set(salas.map((sala) => sala.predio?.nome).filter((nome): nome is string => Boolean(nome)))].sort();
  const salasFiltradas = salas.filter((sala) => {
    const termo = searchRoom.trim().toLocaleLowerCase("pt-BR");
    const correspondeBusca = !termo || sala.nome.toLocaleLowerCase("pt-BR").includes(termo);
    const correspondePredio = !filterBuilding || sala.predio?.nome === filterBuilding;
    const correspondeCapacidade = !minimumCapacity || sala.capacidade >= Number(minimumCapacity);
    const correspondeDia = !filterDay || (sala.horarios_disponiveis ?? []).some(
      (slot) => slot.ativo && slot.dia_semana === Number(filterDay)
    );
    return correspondeBusca && correspondePredio && correspondeCapacidade && correspondeDia;
  });
  const equipamentosDaSala = detailsRoom?.sala_equipamento?.map((item) => item.equipamento?.nome).filter((nome): nome is string => Boolean(nome))
    ?? detailsRoom?.equipamentos?.map((item) => item.nome).filter((nome): nome is string => Boolean(nome));
  const horariosDaSala = (detailsRoom?.horarios_disponiveis ?? []).filter((slot) => slot.ativo);

  return (
    <>
      <PageTitle
        eyebrow="AGENDA DE ESPAÇOS"
        title="Reserva de salas"
        text="Solicitações regulares exigem 48h de antecedência e respeitam o limite de 10h semanais."
        action={
          <div className="reservation-actions">
            <button type="button" className={`secondary-btn reservation-filter-button${filtersOpen ? " active" : ""}`} onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>
              <Icon name="filter" size={16} /> Filtros
            </button>
            <RefreshButton label="agenda" refreshing={refreshing} onRefresh={() => void loadData(true)} />
          </div>
        }
      />

      {filtersOpen && (
        <section className="panel reservation-filters" aria-label="Filtros de salas">
          <label>
            Buscar sala
            <input value={searchRoom} onChange={(event) => setSearchRoom(event.target.value)} placeholder="Nome da sala" />
          </label>
          <label>
            Bloco
            <select value={filterBuilding} onChange={(event) => setFilterBuilding(event.target.value)}>
              <option value="">Todos</option>
              {predios.map((predio) => <option key={predio} value={predio}>{predio}</option>)}
            </select>
          </label>
          <label>
            Capacidade mínima
            <input type="number" min="1" value={minimumCapacity} onChange={(event) => setMinimumCapacity(event.target.value)} placeholder="Qualquer capacidade" />
          </label>
          <label>
            Dia disponível
            <select value={filterDay} onChange={(event) => setFilterDay(event.target.value)}>
              <option value="">Todos</option>
              {Object.entries(DIAS_SEMANA_NOME).filter(([dia]) => Number(dia) >= 1 && Number(dia) <= 6).map(([dia, nome]) => (
                <option key={dia} value={dia}>{nome}</option>
              ))}
            </select>
          </label>
          <button type="button" className="secondary-btn" onClick={() => {
            setSearchRoom("");
            setFilterBuilding("");
            setMinimumCapacity("");
            setFilterDay("");
          }}>Limpar filtros</button>
        </section>
      )}

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
      ) : salasFiltradas.length === 0 ? (
        <p className="panel" style={{ padding: 20 }}>Nenhuma sala corresponde aos filtros atuais.</p>
      ) : (
        <div className="rooms-feed">
          {salasFiltradas.map((sala) => (
            <button
              type="button"
              key={sala.id_sala}
              className="panel room-card"
              onClick={() => openModal(sala)}
              aria-label={`Detalhes da sala ${sala.nome}, capacidade ${sala.capacidade}, bloco ${sala.predio?.nome || "não informado"}`}
            >
              {sala.foto ? <img className="room-card-image" src={sala.foto} alt="" /> : <span className="room-card-image room-card-image-placeholder"><Icon name="building" size={28} /></span>}
              <span className="room-card-info">
                <strong>{sala.nome}</strong>
                <span>{sala.capacidade} lugares</span>
                <span>{sala.predio?.nome || "Bloco não informado"}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {detailsRoom && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal room-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal} aria-label="Fechar">×</button>
            {detailsRoom.foto ? (
              <div className="room-image"><img src={detailsRoom.foto} alt={detailsRoom.nome} /></div>
            ) : null}
            <div className="room-info">
              <h2>{detailsRoom.nome}</h2>
              <dl>
                <div><dt>IDENTIFICAÇÃO</dt><dd>#{detailsRoom.id_sala}</dd></div>
                <div><dt>PRÉDIO</dt><dd>{detailsRoom.predio?.nome || "Não informado"}</dd></div>
                <div><dt>CAPACIDADE</dt><dd>{detailsRoom.capacidade} lugares</dd></div>
              </dl>
              <section className="room-detail-section">
                <h3>Dias e horários disponíveis</h3>
                {horariosDaSala.length ? (
                  <div className="room-slots">
                    {horariosDaSala.map((slot) => (
                      <button type="button" key={slot.id_sala_horario} className={selection?.slot.id_sala_horario === slot.id_sala_horario ? "selected" : ""} onClick={() => selectSlot(slot)}>
                        <Icon name="clock" size={15} />
                        <span><strong>{DIAS_SEMANA_NOME[slot.dia_semana]}</strong>: {slot.horario.hora_inicio}–{slot.horario.hora_fim}</span>
                      </button>
                    ))}
                  </div>
                ) : <p>Não há horários disponíveis cadastrados.</p>}
              </section>
              <section className="room-detail-section">
                <h3>Equipamentos</h3>
                <p>{equipamentosDaSala?.length ? equipamentosDaSala.join(", ") : "Informação de equipamentos não fornecida pela API."}</p>
              </section>
              {selection && (
                <>
                  <div className="reservation-date"><label htmlFor="reservation-date">ESCOLHA A DATA DA RESERVA ({DIAS_SEMANA_NOME[selection.slot.dia_semana]})</label>
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
                </>
              )}
              {conflictWarning && (
                <div className="reservation-conflict">
                  <p>Existe uma reserva confirmada para esta data e horário. Você pode solicitar uma reserva de emergência.</p>
                  <label htmlFor="emergency-reason">Justificativa (mínimo 10 caracteres)</label>
                  <input id="emergency-reason" maxLength={255} value={justificativa} onChange={(event) => setJustificativa(event.target.value)} />
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="secondary-btn" type="button" onClick={closeModal} disabled={loading}>Cancelar</button>
              {!selection ? (
                <span className="room-select-hint">Selecione um horário para continuar.</span>
              ) : conflictWarning ? (
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
