import { useEffect, useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { api } from "../../services/api";
import { RefreshButton } from "../../components/ui/RefreshButton";

interface ItemRanking {
  posicao: number;
  id_sala: number;
  nome_sala: string;
  predio: string;
  total_pontos: number;
  total_avaliacoes: number;
  semestre_letivo: string;
}

export function Ranking() {
  const [ranking, setRanking] = useState<ItemRanking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const now = new Date();
  const semestreLetivo = `${now.getFullYear()}/${now.getMonth() < 6 ? "1" : "2"}`;

  useEffect(() => {
    async function fetchPontuacao() {
      try {
        setLoading(true);
        const token = localStorage.getItem("senai_token") || "";

        // Endpoint exato da sua API
        const response = await fetch(
          `http://localhost:3001/pontuacoes/ranking?semestre_letivo=${semestreLetivo}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Erro ao carregar dados de pontuação.");
        }

        const data: ItemRanking[] = await response.json();
        setRanking(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar pontuação:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPontuacao();
  }, [semestreLetivo]);

  const refreshRanking = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshMessage("");
    try {
      const { data } = await api.get<ItemRanking[]>("/pontuacoes/ranking", {
        params: { semestre_letivo: semestreLetivo },
      });
      setRanking(Array.isArray(data) ? data : []);
      setRefreshMessage("Ranking atualizado.");
    } catch (requestError) {
      console.error("Erro ao atualizar ranking:", requestError);
      setRefreshMessage("Não foi possível atualizar o ranking.");
    } finally {
      setRefreshing(false);
    }
  };

  // Calcula o total acumulado das salas retornadas
  const totalPontos = ranking.reduce((acc, item) => acc + (item.total_pontos || 0), 0);

  if (loading) {
    return <p style={{ padding: "20px" }}>A carregar pontuações...</p>;
  }

  return (
    <>
      <div className="module-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <span>CONSERVAÇÃO</span>
            <h1>Placar de pontuação</h1>
          </div>
          <RefreshButton label="ranking" refreshing={refreshing} onRefresh={() => void refreshRanking()} />
        </div>
        <p>Pontos acumulados no semestre {semestreLetivo}.</p>
        {refreshMessage ? <p role="status">{refreshMessage}</p> : null}
      </div>

      {/* Exibição do total de pontos */}
      <article className="score-card">
        <Icon name="trophy" size={33} />
        <div>
          <span>TOTAL DE PONTOS</span>
          <strong>{totalPontos.toLocaleString("pt-BR")}</strong>
          <small>pontos disponíveis no semestre</small>
        </div>
      </article>

      <div className="mobile-title">
        <div>
          <h2>Ranking por sala</h2>
          <p>Semestre {semestreLetivo}</p>
        </div>
      </div>

      {/* Lista do Ranking alimentada pela API */}
      <div className="ranking">
        {ranking.length === 0 ? (
          <p style={{ padding: "16px" }}>Nenhuma pontuação encontrada.</p>
        ) : (
          ranking.map((item) => (
            <div className={item.posicao === 1 ? "you" : ""} key={item.id_sala}>
              <span>{item.posicao}</span>
              <b>
                {item.nome_sala} <small style={{ fontWeight: 400, opacity: 0.8 }}>({item.predio})</small>
              </b>
              <p>{item.total_pontos} pts</p>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default Ranking;