
import { useState } from "react";
import { Icon } from "../../components/icons/Icon";

function StudentReports() {
  const [sent, setSent] = useState(false);

  if (sent)
    return (
      <>
        <div className="module-heading">
          <span>PROTOCOLO #RL-0415</span>
          <h1>Acompanhar relato</h1>
          <p>Prazo máximo de resposta: 5 dias úteis.</p>
        </div>

        <div className="deadline-card">
          <Icon name="clock" />
          <div>
            <b>4 dias restantes</b>
            <p>Sem risco de escalonamento corporativo.</p>
          </div>
        </div>

        <div className="timeline">
          {[["check","Recebido","Hoje, 09:42","done"],["clock","Em análise","Previsão: até amanhã","active"],["message","Respondido","Aguardando atendimento",""],["box","Arquivado","Histórico permanente",""]].map(x =>
            <div className={x[3]} key={x[1]}>
              <span>
                <Icon name={x[0]} size={15} />
              </span>
              <div>
                <b>{x[1]}</b>
                <p>{x[2]}</p>
              </div>
            </div>
          )}
        </div>

        <button
          className="secondary-btn full"
          onClick={() => setSent(false)}
        >
          Enviar outro relato
        </button>
      </>
    );

  return (
    <>
      <div className="module-heading">
        <span>CANAL IDENTIFICADO</span>
        <h1>Relatos e sugestões</h1>
        <p>Envie críticas, opiniões ou problemas diretamente à gestão.</p>
      </div>

      <form
        className="damage-form suggestion-mobile"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <label>
          Categoria
          <select>
            <option>Infraestrutura</option>
            <option>Acessibilidade</option>
            <option>Comunicação</option>
            <option>Sugestão acadêmica</option>
          </select>
        </label>

        <label>
          Assunto
          <input required placeholder="Resuma o relato" />
        </label>

        <label>
          Mensagem
          <textarea
            required
            minLength={20}
            rows={6}
            placeholder="Conte o que aconteceu e como podemos ajudar..."
          />
        </label>

        <div className="privacy-note">
          <Icon name="check" size={15} />
          Relato identificado e protegido pelo canal institucional.
        </div>

        <button className="primary-btn full">
          Enviar para a gestão
        </button>
      </form>
    </>
  );
}

export default StudentReports;
