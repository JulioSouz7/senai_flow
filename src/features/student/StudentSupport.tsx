
import { useState } from "react";
import { Icon } from "../../components/icons/Icon";

function StudentSupport() {
  const [open, setOpen] = useState(0);

  const faqs = [
    [
      "Como acompanho uma mudança de sala?",
      "Toda alteração oficial aparece no mural “Minha Turma” e também gera uma notificação."
    ],
    [
      "Onde encontro as rotas de fuga?",
      "Abra o Mapa, selecione o Bloco D e ative o filtro “Rotas”."
    ],
    [
      "Como envio um relato para a gestão?",
      "Use a aba Relatos. A mensagem é identificada e deve ser respondida em até 5 dias."
    ],
    [
      "Os comunicados do WhatsApp são oficiais?",
      "Não. O Mural do SENAI Flow é o canal acadêmico oficial da unidade."
    ]
  ];

  return (
    <>
      <div className="module-heading">
        <span>SUPORTE OPERACIONAL</span>
        <h1>Perguntas frequentes</h1>
        <p>Respostas rápidas para as principais dúvidas.</p>
      </div>

      <article className="faq-list student-faq">
        {faqs.map((q, i) => (
          <div key={q[0]}>
            <button onClick={() => setOpen(open === i ? -1 : i)}>
              <b>{q[0]}</b>
              <span>{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p>{q[1]}</p>}
          </div>
        ))}
      </article>

      <div className="support-callout">
        <Icon name="message" />
        <div>
          <b>Ainda precisa de ajuda?</b>
          <p>Envie um relato identificado para a gestão.</p>
        </div>
      </div>
    </>
  );
}

export default StudentSupport;
