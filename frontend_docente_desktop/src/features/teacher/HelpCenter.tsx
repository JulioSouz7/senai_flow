import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { api } from "../../services/api";
import { RefreshButton } from "../../components/ui/RefreshButton";

interface FAQItem {
  id_faq?: number;
  pergunta: string;
  resposta: string;
  categoria?: string;
}

interface Chamado {
  id_chamado: number;
  assunto: string;
  descricao: string;
  status: string;
  dt_abertura: string;
  admin_resp?: { usuario?: { nome?: string } } | null;
  resposta?: string | null;
}

function HelpCenter({
  notify,
}: {
  notify: (message: string, kind?: "success" | "error" | "warning" | "info") => void;
}) {
  const [open, setOpen] = useState<number>(-1);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadChamados = useCallback(async (): Promise<boolean> => {
    try {
      setLoadingChamados(true);
      const { data } = await api.get("/chamados");
      setChamados(Array.isArray(data) ? data : []);
      return true;
    } catch (error) {
      console.error("Erro ao carregar chamados:", error);
      notify(error instanceof Error ? error.message : "Não foi possível carregar o histórico de chamados.", "error");
      return false;
    } finally {
      setLoadingChamados(false);
    }
  }, [notify]);

  const loadFaqs = useCallback(async (): Promise<boolean> => {
    try {
      setLoadingFaqs(true);
      const { data } = await api.get("/faqs");
      setFaqs(Array.isArray(data) ? data : []);
      return true;
    } catch (error) {
      console.error("Erro ao carregar FAQs:", error);
      notify(error instanceof Error ? error.message : "Não foi possível carregar as FAQs.", "error");
      return false;
    } finally {
      setLoadingFaqs(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadFaqs();
    void loadChamados();
  }, [loadChamados, loadFaqs]);

  const refreshSupport = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const [faqsLoaded, ticketsLoaded] = await Promise.all([loadFaqs(), loadChamados()]);
      if (faqsLoaded && ticketsLoaded) notify("FAQs e chamados atualizados.", "success");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmitChamado = async (event: FormEvent) => {
    event.preventDefault();
    if (!assunto.trim() || descricao.trim().length < 30) {
      notify("Informe o assunto e uma descrição com pelo menos 30 caracteres.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/chamados", { assunto: assunto.trim(), descricao: descricao.trim() });
      notify("Chamado de suporte aberto com sucesso!", "success");
      setAssunto("");
      setDescricao("");
      await loadChamados();
    } catch (error) {
      console.error("Erro ao abrir chamado:", error);
      notify(error instanceof Error ? error.message : "Não foi possível abrir o chamado.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="SUPORTE OPERACIONAL"
        title="Suporte"
        text="Consulte as respostas frequentes, abra chamados e acompanhe o atendimento."
        action={<RefreshButton label="suporte" refreshing={refreshing} onRefresh={() => void refreshSupport()} />}
      />

      <div className="help-layout">
        <article className="panel faq-list">
          {loadingFaqs ? (
            <p style={{ padding: 16 }}>Carregando perguntas frequentes...</p>
          ) : faqs.length === 0 ? (
            <p style={{ padding: 16 }}>Nenhuma pergunta frequente cadastrada.</p>
          ) : faqs.map((faq, index) => (
            <div key={faq.id_faq ?? index}>
              <button type="button" onClick={() => setOpen(open === index ? -1 : index)}>
                <b>{faq.pergunta}</b>
                <span>{open === index ? "−" : "+"}</span>
              </button>
              {open === index && <p>{faq.resposta}</p>}
            </div>
          ))}
        </article>

        <form className="panel suggestion-form" onSubmit={handleSubmitChamado}>
          <h2>Abrir chamado de suporte</h2>
          <p>Informe o assunto e descreva o problema para a equipe de atendimento.</p>
          <label>
            Assunto
            <input
              required
              maxLength={100}
              placeholder="Ex.: Projetor da sala não liga"
              value={assunto}
              onChange={(event) => setAssunto(event.target.value)}
            />
          </label>
          <label>
            Descrição
            <textarea
              required
              minLength={30}
              maxLength={255}
              rows={5}
              placeholder="Descreva o problema (mínimo 30 caracteres)..."
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
            />
          </label>
          <button className="primary-btn" disabled={submitting || !assunto.trim() || descricao.trim().length < 30}>
            {submitting ? "Enviando..." : "Abrir chamado"}
          </button>
        </form>
      </div>

      <section className="ticket-history">
        <h2>Histórico de chamados</h2>
        {loadingChamados ? (
          <p className="panel" style={{ padding: 18 }}>Carregando chamados...</p>
        ) : chamados.length === 0 ? (
          <p className="panel" style={{ padding: 18 }}>Você ainda não possui chamados de suporte.</p>
        ) : chamados.map((chamado) => (
          <article className="panel ticket-card" key={chamado.id_chamado}>
            <div className="ticket-heading">
              <h3>{chamado.assunto}</h3>
              <span>{chamado.status.replace(/_/g, " ")}</span>
            </div>
            <p>{chamado.descricao}</p>
            <small>Aberto em {new Date(chamado.dt_abertura).toLocaleString("pt-BR")}</small>
            <small>Responsável: {chamado.admin_resp?.usuario?.nome || "Ainda não atribuído"}</small>
            {chamado.resposta ? <div className="ticket-response">Resposta da gestão: {chamado.resposta}</div> : null}
          </article>
        ))}
      </section>
    </>
  );
}

export default HelpCenter;
