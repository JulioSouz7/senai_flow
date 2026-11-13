import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import { PageTitle } from "../../components/ui/PageTitle";
import { RefreshButton } from "../../components/ui/RefreshButton";

interface ClassRecord {
  id_turma: number;
  nome: string;
  curso: string;
  docente_turma?: Array<{
    docente?: { usuario?: { nome?: string; email?: string } };
  }>;
}

interface Announcement {
  id_comunicado: number;
  id_turma: number | null;
  abrangencia: string;
  titulo: string;
  conteudo: string;
  dt_publicacao?: string;
  administrador?: { usuario?: { nome?: string } };
}

interface MyClassProps {
  classes: ClassRecord[];
  selectedClassId: number | null;
  onSelectClass: (id: number) => void;
  loading: boolean;
  error: string;
  onRefresh: () => Promise<boolean>;
  notify: (message: string, kind?: "success" | "error" | "warning" | "info") => void;
}

function MyClass({ classes, selectedClassId, onSelectClass, loading, error, onRefresh, notify }: MyClassProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const loadAnnouncements = useCallback(async (): Promise<boolean> => {
    const currentRequestId = ++requestId.current;
    if (selectedClassId === null) {
      setAnnouncements([]);
      setAnnouncementsLoading(false);
      setAnnouncementsError("");
      return true;
    }

    setAnnouncementsLoading(true);
    setAnnouncementsError("");
    try {
      const { data } = await api.get<{ comunicados?: Announcement[] }>("/comunicados/minha-turma", {
        params: { id_turma: selectedClassId },
      });
      if (requestId.current !== currentRequestId) return false;
      const rows = Array.isArray(data.comunicados) ? data.comunicados : [];
      setAnnouncements(rows.filter((item) => item.abrangencia === "TURMA" && item.id_turma === selectedClassId));
      return true;
    } catch (requestError: unknown) {
      if (requestId.current !== currentRequestId) return false;
      setAnnouncementsError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os comunicados desta turma.");
      return false;
    } finally {
      if (requestId.current === currentRequestId) setAnnouncementsLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    void loadAnnouncements();
    return () => {
      requestId.current += 1;
    };
  }, [loadAnnouncements]);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const [classesLoaded, announcementsLoaded] = await Promise.all([onRefresh(), loadAnnouncements()]);
      if (classesLoaded && announcementsLoaded) notify("Turmas e comunicados atualizados.", "success");
    } finally {
      setRefreshing(false);
    }
  };

  const turma = classes.find((item) => item.id_turma === selectedClassId);
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  };

  return (
    <>
      <PageTitle
        eyebrow="COMUNIDADE DOCENTE"
        title="Minha turma"
        text="Consulte as turmas vinculadas ao seu perfil e os professores relacionados."
      />
      {loading ? (
        <p className="panel" style={{ padding: 20 }}>Carregando suas turmas...</p>
      ) : error ? (
        <p className="panel" role="alert" style={{ padding: 20 }}>{error}</p>
      ) : classes.length === 0 ? (
        <p className="panel" style={{ padding: 20 }}>Nenhuma turma está vinculada ao seu perfil.</p>
      ) : (
        <>
          {classes.length > 1 && (
            <div className="class-selector" role="tablist" aria-label="Suas turmas">
              {classes.map((item) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedClassId === item.id_turma}
                  className={selectedClassId === item.id_turma ? "active" : ""}
                  key={item.id_turma}
                  onClick={() => onSelectClass(item.id_turma)}
                >
                  {item.nome}
                </button>
              ))}
            </div>
          )}
          {turma && (
            <article className="panel class-card">
              <span className="class-eyebrow">MINHA TURMA</span>
              <h2>{turma.nome}</h2>
              <p className="class-course">{turma.curso || "Curso não informado pela API"}</p>
              <hr />
              <h3>Professores relacionados</h3>
              {turma.docente_turma?.length ? (
                <ul>
                  {turma.docente_turma.map((vinculo, index) => (
                    <li key={`${vinculo.docente?.usuario?.email ?? index}`}>
                      <b>{vinculo.docente?.usuario?.nome || "Nome não informado"}</b>
                      {vinculo.docente?.usuario?.email && (
                        <small>{vinculo.docente.usuario.email}</small>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum professor relacionado retornado pela API.</p>
              )}
            </article>
          )}
          <section aria-labelledby="class-announcements-title" style={{ marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <h2 id="class-announcements-title">Comunicados da Turma</h2>
              <RefreshButton label="turma e comunicados" refreshing={refreshing} onRefresh={() => void refresh()} />
            </div>
            {announcementsLoading ? (
              <p className="panel" style={{ padding: 20 }}>Carregando comunicados da turma...</p>
            ) : announcementsError ? (
              <p className="panel" role="alert" style={{ padding: 20 }}>{announcementsError}</p>
            ) : announcements.length === 0 ? (
              <p className="panel" style={{ padding: 20 }}>Nenhum comunicado destinado a esta turma.</p>
            ) : announcements.map((item) => (
              <article className="panel" key={item.id_comunicado} style={{ padding: 20, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>{item.titulo}</h3>
                  {formatDate(item.dt_publicacao) && (
                    <time style={{ color: "#64748b", whiteSpace: "nowrap" }}>
                      {formatDate(item.dt_publicacao)}
                    </time>
                  )}
                </div>
                <p style={{ margin: "0 0 12px", lineHeight: 1.5 }}>{item.conteudo}</p>
                <p style={{ margin: 0, borderTop: "1px solid #e5e7eb", paddingTop: 10, color: "#64748b" }}>
                  <b>Enviado por:</b> {item.administrador?.usuario?.nome || "Coordenação"}
                </p>
              </article>
            ))}
          </section>
        </>
      )}
    </>
  );
}

export default MyClass;
