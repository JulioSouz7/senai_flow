import { useEffect, useState } from "react";
import { Icon } from "../../components/icons/Icon";
import { PageTitle } from "../../components/ui/PageTitle";

interface Administrador {
  usuario?: {
    nome?: string;
  };
}

interface Sala {
  id_sala: number;
  nome: string;
}

interface Reserva {
  id_reserva: number;
  status?: string;
  sala?: Sala;
}

interface Comunicado {
  id_comunicado: number;
  titulo: string;
  conteudo: string;
  abrangencia: string;
  publico_alvo?: string;
  dt_publicacao?: string;
  dt_envio?: string;
  administrador?: Administrador;
  reserva?: Reserva;
}

function Notifications({ notify }: { notify?: (x: string) => void }) {
  const [comunicadosGerais, setComunicadosGerais] = useState<Comunicado[]>([]);
  const [comunicadosTurma, setComunicadosTurma] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchComunicados = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("senai_token") || "";
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [resGerais, resTurma] = await Promise.allSettled([
          fetch("http://localhost:3001/comunicados", { headers }),
          fetch("http://localhost:3001/comunicados/minha-turma", { headers }),
        ]);

        // 1. Processa comunicados gerais (Retorna Array direto)
        if (resGerais.status === "fulfilled" && resGerais.value.ok) {
          const dataGerais = await resGerais.value.json();
          setComunicadosGerais(Array.isArray(dataGerais) ? dataGerais : []);
        }

        // 2. Processa comunicados da minha turma (Retorna Objeto com { turma, comunicados })
        if (resTurma.status === "fulfilled" && resTurma.value.ok) {
          const dataTurma = await resTurma.value.json();
          
          // Extrai o array da chave 'comunicados' ou faz fallback para array direto
          const listaTurma = Array.isArray(dataTurma) 
            ? dataTurma 
            : Array.isArray(dataTurma?.comunicados) 
              ? dataTurma.comunicados 
              : [];

          setComunicadosTurma(listaTurma);
        }
      } catch (error) {
        console.error("Erro ao carregar comunicados:", error);
        if (notify) notify("Erro ao carregar os comunicados.");
      } finally {
        setLoading(false);
      }
    };

    fetchComunicados();
  }, [notify]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const renderCard = (item: Comunicado) => {
    const autor = item.administrador?.usuario?.nome || "Coordenação";
    const dataStr = formatDate(item.dt_publicacao || item.dt_envio);

    return (
      <article
        key={item.id_comunicado || Math.random()}
        className="panel"
        style={{
          padding: "20px",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          marginBottom: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "8px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            {item.titulo || "Comunicado sem título"}
          </h3>
          {dataStr && (
            <span style={{ fontSize: "0.8rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
              {dataStr}
            </span>
          )}
        </div>

        <p style={{ color: "#334155", fontSize: "0.92rem", lineHeight: "1.5", margin: "0 0 12px 0" }}>
          {item.conteudo || ""}
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.8rem",
            color: "#64748b",
            borderTop: "1px solid #f1f5f9",
            paddingTop: "10px",
          }}
        >
          <span>
            <b>Enviado por:</b> {autor}
          </span>

          {item.reserva?.sala?.nome && (
            <span
              style={{
                backgroundColor: "#fee2e2",
                color: "#e30613",
                padding: "3px 8px",
                borderRadius: "4px",
                fontWeight: 700,
              }}
            >
              {item.reserva.sala.nome}
            </span>
          )}
        </div>
      </article>
    );
  };

  return (
    <div>
      <PageTitle
        eyebrow="QUADRO DE AVISOS"
        title="Comunicados"
        text="Acompanhe os avisos institucionais gerais e as atualizações direcionadas à sua turma."
      />

      {loading ? (
        <p style={{ padding: "20px", color: "#64748b" }}>Carregando comunicados...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          {/* SEÇÃO 1: COMUNICADOS GERAIS */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                borderBottom: "2px solid #e2e8f0",
                paddingBottom: "8px",
              }}
            >
              <Icon name="bell" size={18} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                Comunicados Gerais ({comunicadosGerais.length})
              </h2>
            </div>

            {comunicadosGerais.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                Nenhum comunicado geral disponível.
              </div>
            ) : (
              comunicadosGerais.map(renderCard)
            )}
          </div>

          {/* SEÇÃO 2: MINHA TURMA */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "16px",
                borderBottom: "2px solid #e30613",
                paddingBottom: "8px",
              }}
            >
              <Icon name="building" size={18} />
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#e30613", margin: 0 }}>
                Minha Turma ({comunicadosTurma.length})
              </h2>
            </div>

            {comunicadosTurma.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                Nenhum comunicado para sua turma no momento.
              </div>
            ) : (
              comunicadosTurma.map(renderCard)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;