import { useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { api } from "../../services/api";
import { RefreshButton } from "../../components/ui/RefreshButton";

// Interface baseada na resposta da sua API
interface AreaRisco {
  id_area: number;
  nome: string;
  andar: number;
  imagem_url: string;
}

export function RiskMap() {
  const [areas, setAreas] = useState<AreaRisco[]>([]);
  const [andarSelecionado, setAndarSelecionado] = useState<number>(1); // 1 = Térreo, 2 = 1º Andar
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");

  const refreshAreas = async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshMessage("");
    try {
      const { data } = await api.get<AreaRisco[]>("/areas-risco");
      setAreas(Array.isArray(data) ? data : []);
      setRefreshMessage("Mapa de riscos atualizado.");
    } catch (requestError) {
      console.error("Erro ao atualizar áreas de risco:", requestError);
      setRefreshMessage("Não foi possível atualizar o mapa de riscos.");
    } finally {
      setRefreshing(false);
    }
  };

useEffect(() => {
    const buscarMapas = async () => {
      try {
        // Agora usando o nome correto do seu token
        const token = localStorage.getItem("senai_token"); 

        const response = await fetch("http://localhost:3001/areas-risco", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // A maioria das APIs usa o formato "Bearer <token>"
            "Authorization": `Bearer ${token}` 
          }
        });
        
        const data = await response.json();

        // SEGURANÇA: Só guarda no estado se for realmente uma lista (Array)
        if (Array.isArray(data)) {
          setAreas(data);
        } else {
          console.error("Erro da API ou token inválido/expirado:", data);
          setAreas([]); // Mantém vazio para não quebrar a tela com o .find()
        }
      } catch (error) {
        console.error("Erro ao procurar as áreas de risco:", error);
        setAreas([]);
      } finally {
        setLoading(false);
      }
    };

    buscarMapas();
  }, []);

  // GARANTIA: Valida se 'areas' é um array antes de tentar usar o .find()
  const areaAtual = Array.isArray(areas) 
    ? areas.find((area) => area.andar === andarSelecionado) 
    : undefined;

  return (
    <>
      <div className="module-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <span>SEGURANÇA E ACESSIBILIDADE</span>
            <h1>Mapa de risco</h1>
          </div>
          <RefreshButton label="mapa de riscos" refreshing={refreshing} onRefresh={() => void refreshAreas()} />
        </div>
        {/* Exibe o nome que vem da API de forma dinâmica */}
        <p>{areaAtual ? areaAtual.nome : "Carregando informações..."}</p>
        {refreshMessage ? <p role="status">{refreshMessage}</p> : null}
      </div>

      <div className="map-filters">
        <button
          className={andarSelecionado === 1 ? "active" : ""}
          onClick={() => setAndarSelecionado(1)}
        >
          Térreo
        </button>
        <button
          className={andarSelecionado === 2 ? "active" : ""}
          onClick={() => setAndarSelecionado(2)}
        >
          1º Andar
        </button>
      </div>

      <div className="floor-map-container" style={{ 
        border: "1px solid #e5e7eb", 
        borderRadius: "8px", 
        overflow: "hidden",
        backgroundColor: "#ffffff",
        marginTop: "20px"
      }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
            A carregar mapa...
          </div>
        ) : areaAtual?.imagem_url ? (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit={true}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                {/* Botões de controlo de zoom */}
                <div style={{ 
                  padding: "12px", 
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  gap: "8px",
                  backgroundColor: "#f9fafb"
                }}>
                  <button onClick={() => zoomIn()} className="secondary-btn" style={{ padding: "4px 12px" }}>Zoom +</button>
                  <button onClick={() => zoomOut()} className="secondary-btn" style={{ padding: "4px 12px" }}>Zoom -</button>
                  <button onClick={() => resetTransform()} className="secondary-btn" style={{ padding: "4px 12px" }}>Resetar</button>
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: "#6b7280", alignSelf: "center" }}>
                    Use o scroll do rato ou os dedos para aproximar
                  </span>
                </div>

                {/* Área do mapa interativo com a imagem da API */}
                <TransformComponent wrapperStyle={{ width: "100%", height: "500px" }}>
                  <img 
                    src={areaAtual.imagem_url} 
                    alt={`Mapa de Risco - ${areaAtual.nome}`} 
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
            Nenhum mapa encontrado para este andar.
          </div>
        )}
      </div>
    </>
  );
}

export default RiskMap;