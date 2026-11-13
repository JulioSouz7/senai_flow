import { useState, useEffect } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";

export function EquipmentApprovals({ notify }: { notify: (text: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [handled, setHandled] = useState<number[]>([]);
  const [equipamentosEmAvariaIds, setEquipamentosEmAvariaIds] = useState<number[]>([]);

  const fetchSolicitacoes = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    let failedRequests = false;
    try {
      const [solicitacoesRes, avariasRes] = await Promise.all([
        api.get("/solicitacoes-equipamentos").catch(() => api.get("/solicitacoes").catch((error) => {
          failedRequests = true;
          throw error;
        })),
        api.get("/avarias").catch(() => {
          failedRequests = true;
          return { data: [] };
        }),
      ]);

      if (avariasRes && Array.isArray(avariasRes.data)) {
        const idsComAvariaAberta = avariasRes.data
          .filter((av: any) => {
            const st = String(av.status || "").toUpperCase();
            return st !== "FINALIZADO" && st !== "CONCLUIDO";
          })
          .map((av: any) => Number(av.id_equipamento || av.equipamento?.id_equipamento))
          .filter((id: number) => !isNaN(id) && id > 0);

        setEquipamentosEmAvariaIds(idsComAvariaAberta);
      }

      if (solicitacoesRes && Array.isArray(solicitacoesRes.data)) {
        const pendentes = solicitacoesRes.data.filter(
          (s: any) => !s.status || s.status === "PENDENTE" || s.status === "ENVIADO" || s.status === "EM_ANALISE"
        );
        setRequests(pendentes);
      } else {
        setRequests([]);
      }
      if (manual) notify(failedRequests ? "Solicitações atualizadas parcialmente; não foi possível consultar todas as informações." : "Solicitações de equipamentos atualizadas.");
    } catch (error) {
      console.error("Erro ao carregar solicitações de equipamentos:", error);
      setRequests([]);
      if (manual) notify("Não foi possível atualizar as solicitações de equipamentos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  const decide = async (idSolicitacao: number, statusNovo: "APROVADO" | "RECUSADO") => {
    const protocol = `#EQ-${idSolicitacao}`;
    const statusText = statusNovo === "APROVADO" ? "aprovada" : "recusada";

    try {
      await api
        .patch(`/solicitacoes-equipamentos/${idSolicitacao}/status`, {
          status: statusNovo,
        })
        .catch(() => api.patch(`/solicitacoes/${idSolicitacao}/status`, { status: statusNovo }));

      setHandled((prev) => [...prev, idSolicitacao]);
      notify(`${protocol} ${statusText} com sucesso.`);
      setRequests((prev) => prev.filter((r) => (r.id_solicitacao || r.id) !== idSolicitacao));
    } catch (error: any) {
      console.error("Erro ao atualizar status da solicitação:", error);
      const msg = error?.response?.data?.message || `Erro ao processar ${protocol}`;
      notify(msg);
    }
  };

  return (
    <>
      <PageTitle
        eyebrow="ESTOQUE E RECURSOS"
        title="Solicitações de equipamentos"
        text="Aprove pedidos vinculados a reservas ativas conforme a disponibilidade do estoque."
        action={<RefreshButton refreshing={refreshing} onRefresh={() => void fetchSolicitacoes(true)} />}
      />

      <div className="approval-list">
        {loading ? (
          <p style={{ padding: 20 }}>Carregando solicitações de equipamentos...</p>
        ) : requests.length > 0 ? (
          requests.map((r) => {
            const id = r.id_solicitacao || r.id;
            const protocol = `#EQ-${id}`;
            const isHandled = handled.includes(id);

            const itensLista = Array.isArray(r.itens) && r.itens.length > 0
              ? r.itens
              : Array.isArray(r.itens_solicitacao) && r.itens_solicitacao.length > 0
              ? r.itens_solicitacao
              : [];

            const primeiroItem = itensLista.length > 0 ? itensLista[0] : null;
            const equipObject = primeiroItem?.equipamento || r.equipamento;

            // Dados do Equipamento
            const equipNome =
              equipObject?.nome ||
              r.nome_equipamento ||
              r.descricao ||
              `Equipamento #${id}`;

            // Verifica status em todos os itens da solicitação e também se há avaria aberta no banco
            const algumItemIndisponivel =
              itensLista.length > 0
                ? itensLista.some((it: any) => {
                    const eq = it.equipamento || {};
                    const st = String(eq.status || "").toUpperCase();
                    const eqId = Number(it.id_equipamento || eq.id_equipamento);
                    return (
                      st === "MANUTENCAO" ||
                      st === "INDISPONIVEL" ||
                      st === "INATIVO" ||
                      equipamentosEmAvariaIds.includes(eqId)
                    );
                  })
                : (() => {
                    const st = String(equipObject?.status || r.status_equipamento || "DISPONIVEL").toUpperCase();
                    const eqId = Number(r.id_equipamento || equipObject?.id_equipamento);
                    return (
                      st === "MANUTENCAO" ||
                      st === "INDISPONIVEL" ||
                      st === "INATIVO" ||
                      equipamentosEmAvariaIds.includes(eqId)
                    );
                  })();

            const qtd = primeiroItem?.quantidade || r.quantidade || 1;
            const emManutencao = algumItemIndisponivel;

            // Solicitante e Sala
            const docenteNome =
              r.usuario?.nome ||
              r.reserva?.docente?.usuario?.nome ||
              r.reserva?.docente?.nome ||
              r.reserva?.usuario?.nome ||
              r.docente?.nome ||
              "Docente";

            const salaNome =
              r.reserva?.sala?.nome ||
              r.sala?.nome ||
              (r.reserva?.id_sala ? `Sala ${r.reserva.id_sala}` : "Sala de aula");

            return (
              <article
                className={`panel approval-card ${isHandled ? "handled" : ""}`}
                key={id}
              >
                <div>
                  <span className="protocol">{protocol}</span>
                  <span
                    className="stock"
                    style={emManutencao ? { backgroundColor: "#fee2e2", color: "#991b1b", fontWeight: "bold" } : {}}
                  >
                    {emManutencao ? "Em Manutenção / Avaria" : "Estoque disponível"}
                  </span>
                </div>

                <h2>{equipNome}</h2>

                <p>
                  {docenteNome} • {salaNome} • {qtd} un.
                </p>

                <div className="request-actions">
                  <button
                    className="secondary-btn"
                    disabled={isHandled}
                    onClick={() => decide(id, "RECUSADO")}
                  >
                    Recusar
                  </button>
                  <button
                    className="primary-btn"
                    disabled={isHandled || emManutencao}
                    onClick={() => decide(id, "APROVADO")}
                    title={emManutencao ? "Equipamento em manutenção ou com avaria aberta não pode ser aprovado" : ""}
                  >
                    Aprovar pedido
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <article className="panel approval-card" style={{ padding: 30, textAlign: "center", gridColumn: "1 / -1" }}>
            <p>Nenhuma solicitação de equipamento pendente no momento.</p>
          </article>
        )}
      </div>
    </>
  );
}