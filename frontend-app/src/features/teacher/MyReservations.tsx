import { useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";
import Checklist from "./Checklist";
import Swaps from "./Swaps";

function MyReservations({ notify }: { notify: (x: string) => void }) {
  const [checklist, setChecklist] = useState(false);

  if (checklist)
    return (
      <>
        <button
          className="text-link back-link"
          onClick={() => setChecklist(false)}
        >
          ← Voltar às reservas
        </button>

        <Checklist notify={notify} />
      </>
    );

  return (
    <>
      <PageTitle
        eyebrow="AGENDA DOCENTE"
        title="Minhas reservas"
        text="Acompanhe validações, horários e solicitações de troca."
      />

      <div className="current-class">
        <div>
          <span>AULA EM ANDAMENTO</span>
          <h2>Programação Web • DS2</h2>
          <p>08:00–10:00 • Sala D-02 • Bloco D</p>
        </div>

        <button className="primary-btn" onClick={() => setChecklist(true)}>
          Finalizar aula
        </button>
      </div>

      <div className="reservation-list">
        {[
          ["21 MAR", "Sala D-04", "14:00–16:00", "Aprovada"],
          ["24 MAR", "Laboratório D-02", "16:15–18:00", "Pendente"],
          ["26 MAR", "Sala Maker D", "10:15–12:00", "Aprovada"],
        ].map((r) => (
          <article className="panel" key={r[0]}>
            <span>{r[0]}</span>

            <div>
              <b>{r[1]}</b>
              <p>{r[2]} • DS2</p>
            </div>

            <span className={r[3] === "Aprovada" ? "approved" : "pending"}>
              {r[3]}
            </span>

            <button className="row-btn">
              Detalhes <Icon name="arrow" size={13} />
            </button>
          </article>
        ))}
      </div>

      <Swaps notify={notify} />
    </>
  );
}

export default MyReservations;