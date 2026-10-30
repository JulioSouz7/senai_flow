import { useEffect, useState } from "react";
import { PageTitle } from "../../components/ui/PageTitle";

interface FAQItem {
  id_faq?: number;
  pergunta: string;
  resposta: string;
  categoria?: string;
}

function HelpCenter({ notify }: { notify: (x: string) => void }) {
  const [open, setOpen] = useState<number>(-1);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState<boolean>(true);

  // Estados do formulário de chamado
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 1. Carrega as FAQs dinâmicas da API
  useEffect(() => {
    async function fetchFaqs() {
      try {
        setLoadingFaqs(true);
        const token = localStorage.getItem("senai_token") || "";

        const response = await fetch("http://localhost:3001/faqs", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erro ao carregar as FAQs.");
        }

        const data = await response.json();
        setFaqs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro no fetch de FAQs:", error);
      } finally {
        setLoadingFaqs(false);
      }
    }

    fetchFaqs();
  }, []);

  // 2. Envia o chamado para POST /chamados
  const handleSubmitChamado = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assunto.trim() || !descricao.trim()) {
      notify("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("senai_token") || "";

      const response = await fetch("http://localhost:3001/chamados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assunto: assunto,
          descricao: descricao,
        }),
      });

      if (response.ok) {
        notify("Chamado enviado à gestão com sucesso!");
        setAssunto("");
        setDescricao("");
      } else {
        const errorData = await response.json();
        notify(`Erro ao enviar: ${errorData.message || "Falha ao abrir chamado"}`);
      }
    } catch (error) {
      console.error("Erro ao enviar chamado:", error);
      notify("Erro de conexão ao enviar a mensagem.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="SUPORTE OPERACIONAL"
        title="FAQs e sugestões"
        text="Encontre respostas rápidas ou envie uma mensagem identificada à gestão."
      />

      <div className="help-layout">
        {/* Painel de FAQs Dinâmico */}
        <article className="panel faq-list">
          {loadingFaqs ? (
            <p style={{ padding: "16px" }}>Carregando perguntas frequentes...</p>
          ) : faqs.length === 0 ? (
            <p style={{ padding: "16px" }}>Nenhuma pergunta frequente cadastrada.</p>
          ) : (
            faqs.map((q, i) => (
              <div key={q.id_faq || i}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? -1 : i)}
                >
                  <b>{q.pergunta}</b>
                  <span>{open === i ? "−" : "+"}</span>
                </button>

                {open === i && <p>{q.resposta}</p>}
              </div>
            ))
          )}
        </article>

        {/* Formulário integrado com POST /chamados */}
        <form className="panel suggestion-form" onSubmit={handleSubmitChamado}>
          <h2>Enviar sugestão</h2>
          <p>O atendimento ocorre em até 5 dias úteis.</p>

          <label>
            Assunto
            <input
              required
              placeholder="Resuma sua solicitação"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
            />
          </label>

          <label>
            Mensagem
            <textarea
              required
              minLength={20}
              rows={5}
              placeholder="Descreva sua dúvida ou sugestão..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </label>

          <button className="primary-btn" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      </div>
    </>
  );
}

export default HelpCenter;