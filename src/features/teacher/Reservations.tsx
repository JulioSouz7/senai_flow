import { useEffect, useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";

type Horario = {
  id_horario: number;
  hora_inicio: string;
  hora_fim: string;
};

type SalaHorario = {
  id_sala_horario: number;
  id_sala: number;
  id_horario: number;
  dia_semana: number;
  ativo: boolean;
  horario: Horario;
};

type Predio = {
  id_predio: number;
  nome: string;
};

type SalaAPI = {
  id_sala: number;
  id_predio: number;
  nome: string;
  capacidade: number;
  ativa: boolean;
  qr_code: string;
  foto: string;
  predio: Predio;
  horarios_disponiveis: SalaHorario[];
};

type SelectedModal = {
  sala: SalaAPI;
  slot: SalaHorario;
};

const DIAS_SEMANA_NOME: Record<number, string> = {
  0: "Domingo",
  1: "Segunda-feira",
  2: "Terça-feira",
  3: "Quarta-feira",
  4: "Quinta-feira",
  5: "Sexta-feira",
  6: "Sábado",
  7: "Domingo",
};

function Reservations({
  go,
  notify,
}: {
  go: (n: number) => void;
  notify: (x: string) => void;
}) {
  const [salasDb, setSalasDb] = useState<SalaAPI[]>([]);
  const [activeSelection, setActiveSelection] = useState<SelectedModal | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Estado para controlar o aviso de conflito e justificativa
  const [conflictWarning, setConflictWarning] = useState<boolean>(false);
  const [justificativa, setJustificativa] = useState<string>("");

  useEffect(() => {
    const fetchSalas = async () => {
      try {
        const token = localStorage.getItem("senai_token");

        if (!token) {
          notify("Token não encontrado. Faça login novamente.");
          return;
        }

        const res = await fetch("http://localhost:3001/salas", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setSalasDb(data);
        }
      } catch (error) {
        console.error("Erro ao carregar salas:", error);
      }
    };

    fetchSalas();
  }, [notify]);

  const openModal = (sala: SalaAPI, slot: SalaHorario) => {
    setImgError(false);
    setActiveSelection({ sala, slot });
    setSelectedDate("");
    setConflictWarning(false);
    setJustificativa("");
  };

  const closeModal = () => {
    setActiveSelection(null);
    setSelectedDate("");
    setConflictWarning(false);
    setJustificativa("");
  };

  // 1. AÇÃO DE ENVIAR A RESERVA DE EMERGÊNCIA (POST /reservas/urgencia)
  const handleEmergencyReservation = async () => {
    if (!activeSelection || !selectedDate) {
      notify("Selecione uma data para a reserva de emergência.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("senai_token");

      const payload = {
        id_sala: activeSelection.sala.id_sala,
        id_turma: 1,
        justificativa_urgencia:
          justificativa.trim() ||
          `Necessidade imprevista na ${activeSelection.sala.nome} para aplicação de avaliação prática.`,
        horarios: [
          {
            id_sala_horario: activeSelection.slot.id_sala_horario,
            dt_reserva: selectedDate,
          },
        ],
      };

      const res = await fetch("http://localhost:3001/reservas/urgencia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        notify("Solicitação de reserva de emergência enviada com sucesso! Aguardando aprovação.");
        closeModal();
      } else {
        const errData = await res.json();
        notify(`Erro na solicitação de emergência: ${errData.message || "Falha na requisição."}`);
      }
    } catch (error) {
      console.error("Erro na reserva de emergência:", error);
      notify("Erro de conexão ao enviar solicitação de emergência.");
    } finally {
      setLoading(false);
    }
  };

  // 2. CONFIRMAR RESERVA COMUM
  const confirmReservation = async () => {
    if (!activeSelection || !selectedDate) {
      notify("Selecione uma data para realizar a reserva.");
      return;
    }

    const [year, month, day] = selectedDate.split("-").map(Number);
    const pickedDate = new Date(year, month - 1, day);
    const pickedWeekDay = pickedDate.getDay();
    const slotWeekDay = Number(activeSelection.slot.dia_semana);

    if (pickedWeekDay !== slotWeekDay) {
      notify(
        `A data selecionada não é uma ${DIAS_SEMANA_NOME[slotWeekDay]}. Escolha uma data correspondente.`
      );
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("senai_token");

    const payload = {
      id_sala: activeSelection.sala.id_sala,
      id_turma: 1,
      horarios: [
        {
          id_sala_horario: activeSelection.slot.id_sala_horario,
          dt_reserva: selectedDate,
        },
      ],
    };

    try {
      const res = await fetch("http://localhost:3001/reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        notify("Solicitação de reserva enviada com sucesso!");
        closeModal();
      } else {
        setConflictWarning(true);
      }
    } catch (error) {
      console.error("Erro na reserva:", error);
      notify("Erro de conexão ao enviar reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="AGENDA DE ESPAÇOS"
        title="Reserva de salas"
        text="Solicitações regulares exigem 48h de antecedência e respeitam o limite de 10h semanais."
      />

      <div className="quota">
        <div>
          <span>Uso semanal</span>
          <b>6h de 10h</b>
        </div>
        <div>
          <i />
        </div>
        <p>Você ainda pode reservar 4 horas nesta semana.</p>
      </div>

      <div className="rooms-feed" style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
        {salasDb.map((sala) => (
          <article key={sala.id_sala} className="panel" style={{ padding: "20px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <div>
              {/* Título da sala padronizado em 1.1rem */}
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0F172A", margin: "0 0 4px 0", lineHeight: 1.3 }}>
                {sala.nome}
              </h3>
              {/* Detalhes do prédio padronizados em 0.85rem */}
              <p style={{ color: "#64748B", fontSize: "0.85rem", margin: 0, fontWeight: 400 }}>
                {sala.predio?.nome} • {sala.capacidade} lugares
              </p>
            </div>

            <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {sala.horarios_disponiveis?.filter((s) => s.ativo).map((slot) => (
                <button
                  key={slot.id_sala_horario}
                  onClick={() => openModal(sala, slot)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    background: "#F8FAFC",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.85rem",
                    color: "#0F172A",
                  }}
                >
                  <Icon name="building" size={15} />
                  <span>
                    <strong style={{ fontWeight: 600 }}>{DIAS_SEMANA_NOME[slot.dia_semana]}</strong>: {slot.horario.hora_inicio}–{slot.horario.hora_fim}
                  </span>
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>

      {activeSelection && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal room-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Fechar">
              ×
            </button>

            <div className="room-image">
              {activeSelection.sala.foto && !imgError ? (
                <img src={activeSelection.sala.foto} alt={activeSelection.sala.nome} onError={() => setImgError(true)} />
              ) : (
                <div className="room-image-placeholder">
                  <Icon name="building" size={40} />
                </div>
              )}
            </div>

            <div className="room-info">
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0F172A", margin: "0 0 12px 0" }}>
                {activeSelection.sala.nome}
              </h2>

              <dl>
                <div>
                  <dt>PRÉDIO</dt>
                  <dd>{activeSelection.sala.predio?.nome}</dd>
                </div>
                <div>
                  <dt>CAPACIDADE</dt>
                  <dd>{activeSelection.sala.capacidade} lugares</dd>
                </div>
                <div>
                  <dt>HORÁRIO</dt>
                  <dd>
                    {activeSelection.slot.horario.hora_inicio} às {activeSelection.slot.horario.hora_fim}
                  </dd>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                  <dt>ESCOLHA A DATA DA RESERVA</dt>
                  <dd>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setConflictWarning(false);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #CBD5E1",
                        fontSize: "0.9rem",
                        width: "100%",
                      }}
                    />
                  </dd>
                </div>
              </dl>

              {conflictWarning && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "14px",
                    borderRadius: "8px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#991B1B",
                    fontSize: "0.85rem",
                    lineHeight: "1.4",
                  }}
                >
                  <p style={{ margin: "0 0 8px 0" }}>
                    Já existe uma reserva para esta data e horário. Deseja solicitar uma{" "}
                    <button
                      type="button"
                      onClick={handleEmergencyReservation}
                      disabled={loading}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        fontWeight: "bold",
                        textDecoration: "underline",
                        cursor: "pointer",
                        padding: 0,
                        font: "inherit",
                      }}
                    >
                      Solicitar Reserva de Emergência
                    </button>
                    ?
                  </p>

                  <input
                    type="text"
                    placeholder="Motivo da urgência (Ex: Prova prática imprevista)"
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid #FCA5A5",
                      fontSize: "0.85rem",
                      marginTop: "6px",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={closeModal} disabled={loading}>
                Cancelar
              </button>
              
              {conflictWarning ? (
                <button
                  className="primary-btn"
                  onClick={handleEmergencyReservation}
                  disabled={loading || !selectedDate}
                  style={{ backgroundColor: "#DC2626" }}
                >
                  {loading ? "Enviando..." : "Enviar Emergência"}
                </button>
              ) : (
                <button
                  className="primary-btn"
                  onClick={confirmReservation}
                  disabled={loading || !selectedDate}
                  style={{ backgroundColor: "#E30613" }}
                >
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