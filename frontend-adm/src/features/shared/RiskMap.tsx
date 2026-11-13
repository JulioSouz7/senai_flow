import { useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { api } from "../../services/api";
import { RefreshButton } from "../../components/ui/RefreshButton";

interface Predio {
  id_predio: number;
  nome: string;
}

interface AreaRisco {
  id_area: number;
  id_predio: number;
  nome: string;
  tipo: string;
  orientacao_seguranca: string;
  andar: number;
  imagem_url: string | null;
  status?: string;
  predio?: Predio;
}

interface FormMapaRisco {
  id_predio: string;
  nome: string;
  tipo: string;
  orientacao_seguranca: string;
  andar: string;
}

const TIPOS_RISCO = [
  { value: "GERAL", label: "Geral / Planta Completa" },
  { value: "ROTA_DE_FUGA", label: "Rota de Fuga / Evacuação" },
  { value: "FISICO", label: "Risco Físico" },
  { value: "QUIMICO", label: "Risco Químico" },
  { value: "BIOLOGICO", label: "Risco Biológico" },
  { value: "ERGONOMICO", label: "Risco Ergonômico" },
  { value: "ACIDENTES", label: "Risco de Acidentes / Mecânico" },
];

const formatarNomeAndar = (andar: number) => {
  if (andar === 0) return "Subsolo";
  if (andar === 1) return "Térreo";
  return `${andar - 1}º Andar`;
};

const resolverUrlImagem = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
    return url;
  }
  const baseUrl = (api.defaults.baseURL || "http://localhost:3001").replace(/\/$/, "");
  const caminhoLimpo = url.replace(/\\/g, "/").replace(/^\//, "");
  return `${baseUrl}/${caminhoLimpo}`;
};

export function RiskMap({ notify }: { notify?: (text: string) => void }) {
  const [areas, setAreas] = useState<AreaRisco[]>([]);
  const [predios, setPredios] = useState<Predio[]>([]);
  const [andarSelecionado, setAndarSelecionado] = useState<number>(1);
  const [areaSelecionadaId, setAreaSelecionadaId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastTexto, setToastTexto] = useState<string>("");

  // Estados do Modal de Criar / Editar
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [editandoArea, setEditandoArea] = useState<AreaRisco | null>(null);
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string>("");
  const [form, setForm] = useState<FormMapaRisco>({
    id_predio: "",
    nome: "",
    tipo: "GERAL",
    orientacao_seguranca: "",
    andar: "1",
  });

  // Estados do Modal de Confirmação de Desativação
  const [areaParaDesativar, setAreaParaDesativar] = useState<AreaRisco | null>(null);
  const [desativando, setDesativando] = useState<boolean>(false);

  const avisar = (mensagem: string) => {
    if (notify) {
      notify(mensagem);
    } else {
      setToastTexto(mensagem);
      setTimeout(() => {
        setToastTexto((atual) => (atual === mensagem ? "" : atual));
      }, 4000);
    }
  };

  const buscarDados = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    let failedRequests = false;
    try {
      const [areasRes, prediosRes] = await Promise.all([
        api.get("/areas-risco").catch(() => {
          failedRequests = true;
          return { data: [] };
        }),
        api.get("/predios").catch(() => {
          failedRequests = true;
          return { data: [] };
        }),
      ]);

      const listaAreas: AreaRisco[] = Array.isArray(areasRes.data) ? areasRes.data : [];
      setAreas(listaAreas);

      const listaPrediosRaw = Array.isArray(prediosRes.data)
        ? prediosRes.data
        : Array.isArray(prediosRes.data?.predios)
        ? prediosRes.data.predios
        : [];

      if (listaPrediosRaw.length > 0) {
        setPredios(listaPrediosRaw);
      } else {
        const mapPredios = new Map<number, Predio>();
        listaAreas.forEach((a) => {
          if (a.predio?.id_predio) {
            mapPredios.set(a.predio.id_predio, a.predio);
          } else if (a.id_predio) {
            mapPredios.set(a.id_predio, {
              id_predio: a.id_predio,
              nome: `Prédio ${a.id_predio}`,
            });
          }
        });
        setPredios(Array.from(mapPredios.values()));
      }
      if (manual) avisar(failedRequests ? "Mapa atualizado parcialmente; algumas informações não foram carregadas." : "Mapa de riscos atualizado.");
    } catch (error) {
      console.error("Erro ao carregar áreas de risco:", error);
      setAreas([]);
      if (manual) avisar("Não foi possível atualizar o mapa de riscos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, []);

  useEffect(() => {
    return () => {
      if (previewImagem.startsWith("blob:")) {
        URL.revokeObjectURL(previewImagem);
      }
    };
  }, [previewImagem]);

  const andaresDisponiveis = Array.from(
    new Set([1, 2, ...areas.map((a) => Number(a.andar)).filter((n) => !isNaN(n))])
  ).sort((a, b) => a - b);

  const areasDoAndar = areas.filter((area) => Number(area.andar) === Number(andarSelecionado));
  const areaAtual =
    areasDoAndar.find((a) => a.id_area === areaSelecionadaId) || areasDoAndar[0];

  const abrirModalCriar = () => {
    setEditandoArea(null);
    setArquivoImagem(null);
    setPreviewImagem("");
    setForm({
      id_predio: predios[0]?.id_predio ? String(predios[0].id_predio) : "1",
      nome: "",
      tipo: "GERAL",
      orientacao_seguranca: "",
      andar: String(andarSelecionado),
    });
    setModalAberto(true);
  };

  const abrirModalEditar = (area: AreaRisco) => {
    setEditandoArea(area);
    setArquivoImagem(null);
    setPreviewImagem(resolverUrlImagem(area.imagem_url));
    setForm({
      id_predio: String(area.id_predio || predios[0]?.id_predio || "1"),
      nome: area.nome || "",
      tipo: area.tipo || "GERAL",
      orientacao_seguranca: area.orientacao_seguranca || "",
      andar: String(area.andar ?? 1),
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (salvando) return;
    setModalAberto(false);
    setEditandoArea(null);
    setArquivoImagem(null);
    setPreviewImagem("");
  };

  const handleSelecionarArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setArquivoImagem(file);
    if (file) {
      setPreviewImagem(URL.createObjectURL(file));
    } else if (editandoArea?.imagem_url) {
      setPreviewImagem(resolverUrlImagem(editandoArea.imagem_url));
    } else {
      setPreviewImagem("");
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.id_predio || isNaN(Number(form.id_predio))) {
      avisar("Selecione ou informe um prédio válido.");
      return;
    }
    if (!form.nome.trim()) {
      avisar("O nome do mapa de risco é obrigatório.");
      return;
    }
    if (!form.tipo.trim()) {
      avisar("O tipo de risco é obrigatório.");
      return;
    }
    if (!form.orientacao_seguranca.trim()) {
      avisar("A orientação de segurança é obrigatória.");
      return;
    }
    if (form.andar === "" || isNaN(Number(form.andar))) {
      avisar("Informe um andar válido.");
      return;
    }

    const formData = new FormData();
    formData.append("id_predio", String(Number(form.id_predio)));
    formData.append("nome", form.nome.trim());
    formData.append("tipo", form.tipo.trim().toUpperCase());
    formData.append("orientacao_seguranca", form.orientacao_seguranca.trim());
    formData.append("andar", String(Number(form.andar)));

    if (arquivoImagem) {
      formData.append("imagem", arquivoImagem);
    }

    try {
      setSalvando(true);
      const andarDestino = Number(form.andar);

      if (editandoArea) {
        const res = await api.put(`/areas-risco/${editandoArea.id_area}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        avisar("Mapa de risco atualizado com sucesso.");
        setAndarSelecionado(andarDestino);
        setAreaSelecionadaId(res.data?.id_area || editandoArea.id_area);
      } else {
        const res = await api.post("/areas-risco", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        avisar("Mapa de risco cadastrado com sucesso.");
        setAndarSelecionado(andarDestino);
        if (res.data?.id_area) {
          setAreaSelecionadaId(res.data.id_area);
        }
      }

      fecharModal();
      await buscarDados();
    } catch (error: any) {
      console.error("Erro ao salvar mapa de risco:", error?.response?.data || error);
      const msgErro =
        error?.response?.data?.message ||
        error?.response?.data?.erro ||
        "Erro ao salvar o mapa de risco.";
      avisar(msgErro);
    } finally {
      setSalvando(false);
    }
  };

  const confirmarDesativacao = async () => {
    if (!areaParaDesativar) return;

    try {
      setDesativando(true);
      await api.patch(`/areas-risco/${areaParaDesativar.id_area}/desativar`);
      avisar(`Mapa "${areaParaDesativar.nome}" desativado com sucesso.`);
      setAreaParaDesativar(null);
      setAreaSelecionadaId(null);
      await buscarDados();
    } catch (error: any) {
      console.error("Erro ao desativar área de risco:", error?.response?.data || error);
      avisar(error?.response?.data?.message || "Erro ao desativar o mapa de risco.");
    } finally {
      setDesativando(false);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div className="module-heading" style={{ marginBottom: 0 }}>
          <span>SEGURANÇA E ACESSIBILIDADE</span>
          <h1>Mapa de risco</h1>
          <p>{areaAtual ? areaAtual.nome : "Nenhum mapa cadastrado neste andar"}</p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <RefreshButton refreshing={refreshing} onRefresh={() => void buscarDados(true)} />
          {areaAtual && (
            <>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => abrirModalEditar(areaAtual)}
              >
                Editar Mapa
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setAreaParaDesativar(areaAtual)}
                style={{ color: "#dc2626", borderColor: "#fecaca" }}
              >
                Desativar
              </button>
            </>
          )}
          <button type="button" className="primary-btn" onClick={abrirModalCriar}>
            + Novo Mapa de Risco
          </button>
        </div>
      </div>

      <div className="map-filters">
        {andaresDisponiveis.map((andar) => (
          <button
            key={andar}
            type="button"
            className={andarSelecionado === andar ? "active" : ""}
            onClick={() => {
              setAndarSelecionado(andar);
              setAreaSelecionadaId(null);
            }}
          >
            {formatarNomeAndar(andar)}
          </button>
        ))}
      </div>

      {areasDoAndar.length > 1 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "12px",
          }}
        >
          {areasDoAndar.map((item) => {
            const ativo = areaAtual?.id_area === item.id_area;
            return (
              <button
                key={item.id_area}
                type="button"
                onClick={() => setAreaSelecionadaId(item.id_area)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: ativo ? "1px solid #dc2626" : "1px solid #e2e8f0",
                  backgroundColor: ativo ? "#fef2f2" : "#ffffff",
                  color: ativo ? "#dc2626" : "#475569",
                }}
              >
                {item.nome}
              </button>
            );
          })}
        </div>
      )}

      {areaAtual && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px 16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#f8fafc",
          }}
        >
          <small
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Orientação de Segurança
          </small>
          <p style={{ margin: 0, fontSize: "13px", color: "#1e293b", lineHeight: 1.5 }}>
            {areaAtual.orientacao_seguranca || "Nenhuma orientação cadastrada."}
          </p>
        </div>
      )}

      <div
        className="floor-map-container"
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          marginTop: "20px",
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
            Carregando mapa...
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
                <div
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #e5e7eb",
                    display: "flex",
                    gap: "8px",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => zoomIn()}
                    className="secondary-btn"
                    style={{ padding: "4px 12px" }}
                  >
                    Zoom +
                  </button>
                  <button
                    type="button"
                    onClick={() => zoomOut()}
                    className="secondary-btn"
                    style={{ padding: "4px 12px" }}
                  >
                    Zoom -
                  </button>
                  <button
                    type="button"
                    onClick={() => resetTransform()}
                    className="secondary-btn"
                    style={{ padding: "4px 12px" }}
                  >
                    Resetar
                  </button>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: "12px",
                      color: "#6b7280",
                      alignSelf: "center",
                    }}
                  >
                    Use o scroll do mouse ou os dedos para aproximar
                  </span>
                </div>

                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "500px" }}
                  contentStyle={{
                    width: "100%",
                    height: "500px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={resolverUrlImagem(areaAtual.imagem_url)}
                    alt={`Mapa de Risco - ${areaAtual.nome}`}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        ) : (
          <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
            <p style={{ marginBottom: "12px" }}>
              {areaAtual
                ? "Este mapa de risco ainda não possui uma imagem cadastrada."
                : "Nenhum mapa encontrado para este andar."}
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => (areaAtual ? abrirModalEditar(areaAtual) : abrirModalCriar())}
            >
              {areaAtual ? "Adicionar Imagem ao Mapa" : "Cadastrar Mapa de Risco"}
            </button>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Desativação (substitui o alert/confirm do navegador) */}
      {areaParaDesativar && (
        <div
          onClick={() => !desativando && setAreaParaDesativar(null)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "420px",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              padding: "24px",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#dc2626",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              CONFIRMAÇÃO
            </span>
            <h2 style={{ margin: "4px 0 10px", fontSize: "18px", color: "#0f172a" }}>
              Desativar mapa de risco?
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
              Deseja realmente desativar <b>"{areaParaDesativar.nome}"</b>? Ele deixará de
              aparecer na visualização do mapa.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setAreaParaDesativar(null)}
                disabled={desativando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={confirmarDesativacao}
                disabled={desativando}
              >
                {desativando ? "Desativando..." : "Sim, desativar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro e Edição de Mapa de Risco */}
      {modalAberto && (
        <div
          onClick={fecharModal}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "560px",
              maxHeight: "90vh",
              overflowY: "auto",
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "18px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#dc2626",
                    letterSpacing: "0.05em",
                  }}
                >
                  {editandoArea ? `EDITAR REGISTRO #${editandoArea.id_area}` : "NOVO REGISTRO"}
                </span>
                <h2 style={{ margin: "2px 0 0", fontSize: "20px", color: "#0f172a" }}>
                  {editandoArea ? "Editar Mapa de Risco" : "Cadastrar Mapa de Risco"}
                </h2>
              </div>
              <button
                type="button"
                onClick={fecharModal}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSalvar} style={{ display: "grid", gap: "14px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                    }}
                  >
                    Prédio *
                  </label>
                  {predios.length > 0 ? (
                    <select
                      value={form.id_predio}
                      onChange={(e) => setForm({ ...form, id_predio: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        height: "38px",
                        padding: "0 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      <option value="">Selecione...</option>
                      {predios.map((p) => (
                        <option key={p.id_predio} value={p.id_predio}>
                          {p.nome}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={form.id_predio}
                      onChange={(e) => setForm({ ...form, id_predio: e.target.value })}
                      placeholder="ID do prédio (ex: 1)"
                      required
                      style={{
                        width: "100%",
                        height: "38px",
                        padding: "0 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "4px",
                    }}
                  >
                    Andar *
                  </label>
                  <select
                    value={form.andar}
                    onChange={(e) => setForm({ ...form, andar: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      height: "38px",
                      padding: "0 10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <option value="0">0 - Subsolo</option>
                    <option value="1">1 - Térreo</option>
                    <option value="2">2 - 1º Andar</option>
                    <option value="3">3 - 2º Andar</option>
                    <option value="4">4 - 3º Andar</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  Nome do Mapa / Setor *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Mapa de Risco - Bloco D (Térreo)"
                  required
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  Tipo de Risco *
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    height: "38px",
                    padding: "0 10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  {TIPOS_RISCO.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  Orientação de Segurança *
                </label>
                <textarea
                  rows={3}
                  value={form.orientacao_seguranca}
                  onChange={(e) =>
                    setForm({ ...form, orientacao_seguranca: e.target.value })
                  }
                  placeholder="Descreva rotas de fuga, pontos de encontro, extintores e EPIs obrigatórios..."
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  Imagem da Planta / Mapa {editandoArea ? "(opcional para substituir)" : ""}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSelecionarArquivo}
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    padding: "8px",
                    borderRadius: "8px",
                    border: "1px dashed #cbd5e1",
                    backgroundColor: "#f8fafc",
                    boxSizing: "border-box",
                  }}
                />

                {previewImagem && (
                  <div
                    style={{
                      marginTop: "10px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      overflow: "hidden",
                      backgroundColor: "#f8fafc",
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={previewImagem}
                      alt="Pré-visualização do mapa"
                      style={{
                        maxHeight: "180px",
                        width: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "8px",
                }}
              >
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-btn" disabled={salvando}>
                  {salvando
                    ? "Salvando..."
                    : editandoArea
                    ? "Salvar Alterações"
                    : "Cadastrar Mapa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast flutuante nativo do frontend */}
      {toastTexto && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "10px",
            backgroundColor: "#0f172a",
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 500,
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.25)",
            borderLeft: "4px solid #dc2626",
            maxWidth: "360px",
          }}
        >
          <span style={{ flex: 1 }}>{toastTexto}</span>
          <button
            type="button"
            onClick={() => setToastTexto("")}
            style={{
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              fontSize: "16px",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

export default RiskMap;