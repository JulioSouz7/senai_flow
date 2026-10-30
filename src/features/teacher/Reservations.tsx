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

  // Estado para controlar o aviso/notificação de conflito
  const [conflictWarning, setConflictWarning] = useState<boolean>(false);

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
  };

  const closeModal = () => {
    setActiveSelection(null);
    setSelectedDate("");
    setConflictWarning(false);
  };

  // Trata o clique de reserva de emergência enviado pelo aviso
  const handleEmergencyReservation = () => {
    notify(`Solicitação de emergência enviada para a sala ${activeSelection?.sala.nome} no dia ${selectedDate}. Aguardando aprovação do administrador.`);
    closeModal();
  };

const confirmReservation = async () => {
  if (!activeSelection || !selectedDate) {
    notify("Selecione uma data para realizar a reserva.");
    return;
  }

  // 1. Quebra a data selecionada (YYYY-MM-DD) para evitar problemas de timezone
  const [year, month, day] = selectedDate.split("-").map(Number);
  const pickedDate = new Date(year, month - 1, day);

  // 2. Descobre o dia da semana da data escolhida pelo usuário (0 = Dom, 1 = Seg ... 4 = Qui)
  const pickedWeekDay = pickedDate.getDay();

  // Se a sua API usa 1 = Segunda ... 7 = Domingo, descomente a linha abaixo:
  // const apiPickedWeekDay = pickedWeekDay === 0 ? 7 : pickedWeekDay;

  // 3. Compara o dia da semana da data escolhida com o dia da semana do slot
  const slotWeekDay = Number(activeSelection.slot.dia_semana);

  if (pickedWeekDay !== slotWeekDay) {
    notify(
      `A data selecionada não é uma ${DIAS_SEMANA_NOME[slotWeekDay]}. Escolha uma data correspondente.`
    );
    return; // Interrompe o envio para a API
  }

  // Se passou na validação, prossegue com o envio do POST...
  setLoading(true);
  const token = localStorage.getItem("senai_token");

  const payload = {
    id_sala: activeSelection.sala.id_sala,
    id_turma: 4,
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
      notify("Erro ao solicitar reserva. Verifique os dados.");
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
        action={
          <button
            className="emergency-btn"
            onClick={() => notify("Solicitação de emergência iniciada")}
          >
            <Icon name="alert" size={17} />
            Reserva de emergência
          </button>
        }
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
              <h3 style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{sala.nome}</h3>
              <p style={{ color: "#64748B", fontSize: "0.9rem" }}>
                {sala.predio.nome} • {sala.capacidade} lugares
              </p>
            </div>

            <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {sala.horarios_disponiveis?.filter((s) => s.ativo).map((slot) => (
                <button
                  key={slot.id_sala_horario}
                  onClick={() => openModal(sala, slot)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #CBD5E1",
                    background: "#F8FAFC",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Icon name="building" size={16} />
                  <span>
                    <strong>{DIAS_SEMANA_NOME[slot.dia_semana]}</strong>: {slot.horario.hora_inicio}–{slot.horario.hora_fim}
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
              <h2>{activeSelection.sala.nome}</h2>

              <dl>
                <div>
                  <dt>PRÉDIO</dt>
                  <dd>{activeSelection.sala.predio.nome}</dd>
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
                        fontSize: "0.95rem",
                        width: "100%",
                      }}
                    />
                  </dd>
                </div>
              </dl>

              {/* NOTIFICAÇÃO DE CONFLITO / RESERVA JÁ EXISTENTE */}
              {conflictWarning && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    color: "#991B1B",
                    fontSize: "0.88rem",
                    lineHeight: "1.4",
                  }}
                >
                  <p>
                    Já existe uma reserva para esta data e horário. Deseja solicitar uma{" "}
                    <button
                      onClick={handleEmergencyReservation}
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
                      reserva de emergência
                    </button>
                    ?
                  </p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={closeModal} disabled={loading}>
                Cancelar
              </button>
              <button className="primary-btn" onClick={confirmReservation} disabled={loading || !selectedDate}>
                {loading ? "Enviando..." : "Solicitar reserva"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Reservations;