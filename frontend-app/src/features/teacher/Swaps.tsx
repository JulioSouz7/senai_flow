import { useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";

function Swaps({ notify }: { notify: (x: string) => void }) {
  const [status, setStatus] = useState("");

  return (
    <>
      <PageTitle
        eyebrow="NEGOCIAÇÃO ENTRE DOCENTES"
        title="Central de trocas"
        text="Aceite ou recuse solicitações sem intervenção da coordenação."
      />

      <article className="panel swap-request">
        <div className="request-top">
          <span className="protocol">NOVA SOLICITAÇÃO</span>
          <span>Recebida há 8 min</span>
        </div>

        <div className="swap-person">
          <span className="avatar">JA</span>

          <div>
            <b>Juliana Alves</b>
            <p>Docente • Eletroeletrônica</p>
          </div>
        </div>

        <h2>Solicitou uma troca de sala com você</h2>

        <div className="swap-compare">
          <div>
            <small>SUA RESERVA</small>
            <b>Sala D-04</b>
            <p>21 mar • 14:00–16:00</p>
          </div>

          <Icon name="swap" />

          <div>
            <small>RESERVA PROPOSTA</small>
            <b>Laboratório D-02</b>
            <p>21 mar • 14:00–16:00</p>
          </div>
        </div>

        {status ? (
          <p className="success-message">Solicitação {status}.</p>
        ) : (
          <div className="request-actions">
            <button
              className="secondary-btn"
              onClick={() => {
                setStatus("recusada");
                notify("Reserva original mantida");
              }}
            >
              Recusar
            </button>

            <button
              className="primary-btn"
              onClick={() => {
                setStatus("aceita");
                notify("Troca efetuada automaticamente");
              }}
            >
              Aceitar troca
            </button>
          </div>
        )}
      </article>
    </>
  );
}

export default Swaps;