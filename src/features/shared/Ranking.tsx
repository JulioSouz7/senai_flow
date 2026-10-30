import { useEffect, useState } from "react";
import { Icon } from "../../components/icons/Icon";

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

  useEffect(() => {
    async function fetchPontuacao() {
      try {
        setLoading(true);
        const token = localStorage.getItem("senai_token") || "";

        // Endpoint exato da sua API
        const response = await fetch(
          "http://localhost:3001/pontuacoes/ranking?semestre_letivo=2026/2",
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
  }, []);

  // Calcula o total acumulado das salas retornadas
  const totalPontos = ranking.reduce((acc, item) => acc + (item.total_pontos || 0), 0);

  if (loading) {
    return <p style={{ padding: "20px" }}>A carregar pontuações...</p>;
  }

  return (
    <>
      <div className="module-heading">
        <span>CONSERVAÇÃO</span>
        <h1>Placar de pontuação</h1>
        <p>Pontos acumulados no semestre 2026/2.</p>
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
          <p>Semestre 2026/2</p>
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