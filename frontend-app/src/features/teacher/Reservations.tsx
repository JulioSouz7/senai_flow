import { useEffect, useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const YEAR = 2027;

type Room = {
  name: string;
  building: string;
  capacity: number;
  time: string;
  image?: string; // caminho da foto, ex: "/rooms/d-04.jpg"
};

const ROOMS: Room[] = [
  {
    name: "Sala D-04",
    building: "Prédio D",
    capacity: 32,
    time: "14:00–16:00",
    image: "/rooms/d-04.jpg",
  },
  {
    name: "Laboratório D-02",
    building: "Prédio D",
    capacity: 24,
    time: "16:15–18:00",
    image: "/rooms/d-02.jpg",
  },
  {
    name: "Sala Maker D",
    building: "Prédio D",
    capacity: 20,
    time: "18:15–20:00",
    image: "/rooms/maker-d.jpg",
  },
];

function Reservations({
  go,
  notify,
}: {
  go: (n: number) => void;
  notify: (x: string) => void;
}) {
  const [month, setMonth] = useState(0);
  const [selected, setSelected] = useState("");
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [imgError, setImgError] = useState(false);

  const firstWeekday = new Date(YEAR, month, 1).getDay();
  const daysInMonth = new Date(YEAR, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const changeMonth = (delta: number) => {
    const next = month + delta;
    if (next < 0 || next > 11) return;
    setMonth(next);
    setSelected("");
  };

  const openRoom = (room: Room) => {
    setImgError(false);
    setActiveRoom(room);
  };

  const closeRoom = () => setActiveRoom(null);

  // Fecha o modal com a tecla Esc
  useEffect(() => {
    if (!activeRoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRoom();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeRoom]);

  const confirmReservation = () => {
    notify("Reserva enviada para validação");
    closeRoom();
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

      <div className="reservation-grid">
        <article className="panel calendar">
          <div className="panel-head">
            <h2>
              {MONTHS[month]} de {YEAR}
            </h2>
            <div>
              <button onClick={() => changeMonth(-1)} disabled={month === 0}>
                ‹
              </button>
              <button onClick={() => changeMonth(1)} disabled={month === 11}>
                ›
              </button>
            </div>
          </div>

          <div className="calendar-body">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <b key={i}>{d}</b>
            ))}

            {Array.from({ length: totalCells }, (_, i) => {
              const day = i - firstWeekday + 1;
              const valid = day >= 1 && day <= daysInMonth;

              return (
                <button
                  disabled={!valid}
                  className={
                    valid && String(day) === selected
                      ? "selected"
                      : valid && (day === 23 || day === 24)
                        ? "available"
                        : ""
                  }
                  onClick={() => setSelected(String(day))}
                  key={i}
                >
                  {valid ? day : ""}
                </button>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span>
              <i />
              Disponibilidade alta
            </span>
            <span>
              <i />
              Selecionado
            </span>
          </div>
        </article>

        <article className="panel available-rooms">
          <div className="panel-head">
            <div>
              <h2>
                {selected
                  ? `${selected} de ${MONTHS[month].toLowerCase()}`
                  : "Selecione um dia"}
              </h2>
              <p>Salas disponíveis após 48h</p>
            </div>
          </div>

          {ROOMS.map((r) => (
            <button key={r.name} disabled={!selected} onClick={() => openRoom(r)}>
              <span>
                <Icon name="building" size={18} />
              </span>

              <div>
                <b>{r.name}</b>
                <small>{r.capacity} lugares</small>
              </div>

              <p>{r.time}</p>
              <Icon name="arrow" size={15} />
            </button>
          ))}
        </article>
      </div>

      <button className="text-link" onClick={() => go(1)}>
        Tem uma reserva? Acompanhar trocas pendentes{" "}
        <Icon name="arrow" size={14} />
      </button>

      {activeRoom && (
        <div className="modal-overlay" onClick={closeRoom}>
          <div
            className="modal room-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes de ${activeRoom.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={closeRoom} aria-label="Fechar">
              ×
            </button>

            <div className="room-image">
              {activeRoom.image && !imgError ? (
                <img
                  src={activeRoom.image}
                  alt={activeRoom.name}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="room-image-placeholder">
                  <Icon name="building" size={40} />
                </div>
              )}
            </div>

            <div className="room-info">
              <h2>{activeRoom.name}</h2>

              <dl>
                <div>
                  <dt>Prédio</dt>
                  <dd>{activeRoom.building}</dd>
                </div>
                <div>
                  <dt>Capacidade</dt>
                  <dd>{activeRoom.capacity} lugares</dd>
                </div>
                <div>
                  <dt>Data</dt>
                  <dd>
                    {selected} de {MONTHS[month].toLowerCase()} de {YEAR}
                  </dd>
                </div>
                <div>
                  <dt>Horário</dt>
                  <dd>{activeRoom.time}</dd>
                </div>
              </dl>
            </div>

            <div className="modal-actions">
              <button onClick={closeRoom}>Cancelar</button>
              <button className="primary-btn" onClick={confirmReservation}>
                Solicitar reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Reservations;