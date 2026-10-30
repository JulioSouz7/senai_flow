import { useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";

function Swaps({ notify }: { notify: (x: string) => void }) {
  const [status, setStatus] = useState("");
  const [myReservation, setMyReservation] = useState("");
  const [targetReservation, setTargetReservation] = useState("");

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myReservation || !targetReservation) {
      notify("Selecione ambas as reservas para propor a troca.");
      return;
    }
    notify("Solicitação de troca enviada ao docente com sucesso!");
    setMyReservation("");
    setTargetReservation("");
  };

  return (
    <>
      <PageTitle
        eyebrow="NEGOCIAÇÃO ENTRE DOCENTES"
        title="Central de trocas"
        text="Aceite ou recuse solicitações recebidas ou proponha trocas de sala."
      />

      <div className="swaps-grid">
        {/* Painel 1: Solicitação Recebida */}
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
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setStatus("recusada");
                  notify("Reserva original mantida");
                }}
              >
                Recusar
              </button>

              <button
                type="button"
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

        {/* Painel 2: Enviar Nova Proposta */}
        <article className="panel swap-request">
          <div className="request-top">
            <span className="protocol">ENVIAR PROPOSTA</span>
            <span>Troca Direta</span>
          </div>

          <h2>Solicitar troca de sala</h2>

          <form onSubmit={handleSendRequest} className="swap-form">
            <div className="form-group">
              <label htmlFor="my-res-select">1. SUA RESERVA QUE DESEJA OFERECER</label>
              <select
                id="my-res-select"
                value={myReservation}
                onChange={(e) => setMyReservation(e.target.value)}
              >
                <option value="">Selecione sua reserva...</option>
                <option value="1">Sala D-04 • 21 mar, 14:00–16:00</option>
                <option value="2">Laboratório D-02 • 24 mar, 16:15–18:00</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="target-res-select">2. SALA / RESERVA QUE DESEJA RECEBER</label>
              <select
                id="target-res-select"
                value={targetReservation}
                onChange={(e) => setTargetReservation(e.target.value)}
              >
                <option value="">Selecione a reserva de interesse...</option>
                <option value="101">Laboratório D-02 • Prof. Juliana Alves (21 mar)</option>
                <option value="102">Sala Maker D • Prof. Ricardo Santos (26 mar)</option>
              </select>
            </div>

            <button type="submit" className="primary-btn" style={{ marginTop: "12px", width: "100%" }}>
              Enviar proposta de troca
            </button>
          </form>
        </article>
      </div>
    </>
  );
}

export default Swaps;