import { useState, useEffect } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { Stat } from "../../components/ui/Stat";
import { Icon } from "../../components/icons/Icon";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";

export function ManagementHome({ go, notify }: { go: (n: number) => void; notify: (text: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [salas, setSalas] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [avarias, setAvarias] = useState<any[]>([]);
  const [solicitacoesEquip, setSolicitacoesEquip] = useState<any[]>([]);

  const fetchAllData = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    let failedRequests = 0;
    const fetchWithFallback = async (request: () => Promise<any>, fallback?: () => Promise<any>) => {
      try {
        return await request();
      } catch {
        if (fallback) {
          try {
            return await fallback();
          } catch {
            failedRequests += 1;
            return { data: [] };
          }
        }
        failedRequests += 1;
        return { data: [] };
      }
    };

    try {
      const [resDashboard, resSalas, resReservas, resAvarias, resSolicitacoes] = await Promise.all([
        fetchWithFallback(() => api.get("/dashboard")),
        fetchWithFallback(() => api.get("/salas")),
        fetchWithFallback(() => api.get("/reservas")),
        fetchWithFallback(() => api.get("/avarias"), () => api.get("/chamados")),
        fetchWithFallback(() => api.get("/solicitacoes"), () => api.get("/solicitacoes-equipamentos"))
      ]);

      if (resDashboard.data) setDashboardData(resDashboard.data);
      if (Array.isArray(resSalas.data)) setSalas(resSalas.data);
      if (Array.isArray(resReservas.data)) setReservas(resReservas.data);
      if (Array.isArray(resAvarias.data)) setAvarias(resAvarias.data);
      if (Array.isArray(resSolicitacoes.data)) setSolicitacoesEquip(resSolicitacoes.data);
      if (manual) notify(failedRequests ? "Alguns dados do painel não puderam ser atualizados." : "Painel atualizado.");
    } catch (error) {
      console.error("Erro ao carregar dados do painel:", error);
      if (manual) notify("Não foi possível atualizar o painel.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchAllData();
  }, []);

  // Filtros defensivos para os indicadores superiores
  const avariasEmAnaliseLista = avarias.filter((a: any) => {
    const s = String(a.status || a.situacao || "").toUpperCase().trim();
    return ["EM_ANALISE", "EM ANALISE", "EM ANÁLISE", "ANALISE", "ANÁLISE", "ABERTO"].includes(s);
  });

  const stats = dashboardData?.estatisticas;
  const reservasAtivas = stats?.reservas?.ativas ?? reservas.filter((r) => {
    const st = String(r.status || "").toUpperCase().trim();
    return st === "ATIVA" || st === "APROVADA";
  }).length;

  const reservasTotais = stats?.reservas?.total ?? reservas.length;
  const avariasAnalise = avariasEmAnaliseLista.length || (stats?.avarias?.em_analise ?? 0);
  const avariasTotais = avarias.length || (stats?.avarias?.total ?? 0);

  // Métrica calculada para Solicitações de Equipamentos (Substituindo Trocas Pendentes)
  const solicitacoesPendentesLista = solicitacoesEquip.filter((s: any) => {
    const st = String(s.status || s.situacao || "").toUpperCase().trim();
    return st === "PENDENTE" || st === "AGUARDANDO";
  });
  const totalSolicitacoesEquip = solicitacoesPendentesLista.length || (stats?.solicitacoes_equipamentos?.pendentes ?? solicitacoesEquip.length ?? 0);

  const comunicadosTotais = stats?.comunicados?.total ?? 0;

  // Filtragem estrita de solicitações PENDENTES para o card de emergências
  const emergenciasPendentes = reservas.filter((r: any) => {
    const status = String(r.status || r.status_reserva || "").toUpperCase().trim();
    return status === "PENDENTE" || status === "AGUARDANDO";
  });

  const primeiraEmergencia = emergenciasPendentes[0];

  // Limite máximo de 6 salas visíveis no painel do Dashboard
  const salasExibidas = salas.slice(0, 6);

  return (
    <>
      <PageTitle
        eyebrow="OPERAÇÃO EM TEMPO REAL • BLOCO D"
        title="Visão geral do campus"
        text="Ocupação, manutenção e solicitações que precisam da sua atenção."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <RefreshButton refreshing={refreshing} onRefresh={() => void fetchAllData(true)} />
            <button className="primary-btn" onClick={() => go(5)}>
              <Icon name="plus" size={17}/> Novo comunicado
            </button>
          </div>
        }
      />

      {/* Indicadores numéricos superiores */}
      <section className="stats">
        <Stat
          icon="building"
          label="RESERVAS ATIVAS"
          value={String(reservasAtivas).padStart(2, "0")}
          note={`${reservasTotais} solicitações registradas`}
        />
        <Stat
          icon="tool"
          label="AVARIAS EM ANÁLISE"
          value={String(avariasAnalise).padStart(2, "0")}
          note={`${avariasTotais} avarias no total`}
          tone="amber"
        />
        <Stat
          icon="box"
          label="SOLICITAÇÕES DE EQUIP."
          value={String(totalSolicitacoesEquip).padStart(2, "0")}
          note="Aguardando aprovação"
          tone="blue"
          onClick={() => go(2)}
        />
        <Stat
          icon="message"
          label="COMUNICADOS"
          value={String(comunicadosTotais).padStart(2, "0")}
          note="Publicados no mural"
          tone="green"
        />
      </section>

      <div className="management-grid">
        {/* Painel de Ocupação do Bloco D */}
        <article className="panel occupancy">
          <div className="panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2>Ocupação do Bloco D</h2>
              <p>Atualizado em tempo real</p>
            </div>
            <button
              className="secondary-btn"
              onClick={() => go(4)} // Redireciona para Cadastros (go(4))
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              Gerenciar salas
            </button>
          </div>

          <div className="room-grid">
            {loading ? (
              <p style={{ padding: 20, color: "#64748b" }}>Carregando salas...</p>
            ) : salasExibidas.length > 0 ? (
              salasExibidas.map((sala: any) => (
                <button
                  key={sala.id_sala || sala.nome}
                  onClick={() => go(4)} // Redireciona para Cadastros
                  style={{ textAlign: "left", cursor: "pointer" }}
                >
                  <span className="room-status free" />
                  <div style={{ flex: 1 }}>
                    <b>{sala.nome}</b>
                    <p style={{ margin: "2px 0 0", color: "#64748b" }}>
                      {sala.descricao || "Sem observações"}
                    </p>
                  </div>
                  <Icon name="arrow" size={15}/>
                </button>
              ))
            ) : (
              // Fallback com limite de 6 salas
              ["D101", "D102", "D103", "Laboratorio 2000", "D104", "D105"].map((nomeSala) => (
                <button key={nomeSala} onClick={() => go(4)} style={{ textAlign: "left", cursor: "pointer" }}>
                  <span className="room-status free" />
                  <div style={{ flex: 1 }}>
                    <b>{nomeSala}</b>
                    <p style={{ margin: "2px 0 0", color: "#64748b" }}>Sem observações</p>
                  </div>
                  <Icon name="arrow" size={15}/>
                </button>
              ))
            )}
          </div>
        </article>

        {/* Card de Emergências */}
        <article className="panel emergency-card">
          <div className="panel-head">
            <div><h2>Reservas de emergência</h2><p>Decisão em até 10 minutos</p></div>
            <span className="count">{emergenciasPendentes.length}</span>
          </div>

          {primeiraEmergencia ? (
            <div className="emergency-item">
              <span className="urgent">{primeiraEmergencia.tipo || "URGENTE"}</span>
              <h3>Solicitação de Reserva #{primeiraEmergencia.id_reserva || primeiraEmergencia.id}</h3>
              <p>Turma ID: {primeiraEmergencia.id_turma || "N/A"} | Sala ID: {primeiraEmergencia.id_sala || "N/A"}</p>

              <div className="request-route">
                <b>Status: {primeiraEmergencia.status}</b>
                <span>{new Date(primeiraEmergencia.dt_solicitacao || Date.now()).toLocaleDateString("pt-BR")}</span>
              </div>

              <div className="action-row">
                <button className="secondary-btn" onClick={() => go(1)}>Analisar</button>
                <button className="primary-btn" onClick={() => go(1)}>Decidir agora</button>
              </div>
            </div>
          ) : (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
              <p>Nenhuma emergência pendente no momento.</p>
            </div>
          )}

          <button className="panel-link" onClick={() => go(1)}>
            Ver fila completa <Icon name="arrow" size={14}/>
          </button>
        </article>
      </div>
    </>
  );
}

export default ManagementHome;