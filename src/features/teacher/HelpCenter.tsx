import { useState } from "react";
import { PageTitle } from "../../components/ui/PageTitle";

function HelpCenter({ notify }: { notify: (x: string) => void }) {
  const [open, setOpen] = useState(0);

  return (
    <>
      <PageTitle
        eyebrow="SUPORTE OPERACIONAL"
        title="FAQs e sugestões"
        text="Encontre respostas rápidas ou envie uma mensagem identificada à gestão."
      />

      <div className="help-layout">
        <article className="panel faq-list">
          {[
            [
              "Como solicitar uma reserva de emergência?",
              "Na Agenda de Salas, escolha um horário ocupado e use “Reserva de emergência”. A gestão responderá em até 10 minutos.",
            ],
            [
              "Como o limite de 10 horas é calculado?",
              "São somadas todas as reservas aprovadas entre segunda e domingo para o seu usuário.",
            ],
            [
              "Um relato de avaria reduz pontos?",
              "Não. Relatos completos, com foto e descrição técnica, preservam a pontuação da turma.",
            ],
            [
              "Como solicitar um equipamento extra?",
              "Escolha uma reserva ativa e selecione o recurso disponível no estoque da unidade.",
            ],
          ].map((q, i) => (
            <div key={q[0]}>
              <button onClick={() => setOpen(open === i ? -1 : i)}>
                <b>{q[0]}</b>
                <span>{open === i ? "−" : "+"}</span>
              </button>

              {open === i && <p>{q[1]}</p>}
            </div>
          ))}
        </article>

        <form
          className="panel suggestion-form"
          onSubmit={(e) => {
            e.preventDefault();
            notify("Sugestão enviada à gestão");
          }}
        >
          <h2>Enviar sugestão</h2>
          <p>O atendimento ocorre em até 5 dias úteis.</p>

          <label>
            Assunto
            <input required placeholder="Resuma sua solicitação" />
          </label>

          <label>
            Mensagem
            <textarea
              required
              minLength={20}
              rows={5}
              placeholder="Descreva sua dúvida ou sugestão..."
            />
          </label>

          <button className="primary-btn">Enviar mensagem</button>
        </form>
      </div>
    </>
  );
}

export default HelpCenter;