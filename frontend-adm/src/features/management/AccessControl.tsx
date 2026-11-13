import { useState, useEffect } from "react";
import { PageTitle } from "../../components/ui/PageTitle";
import { Icon } from "../../components/icons/Icon";
import { RefreshButton } from "../../components/ui/RefreshButton";
import { api } from "../../services/api";

interface TurmaDB {
  id_turma: number;
  nome: string;
  codigo?: string;
  docentes?: Array<{ id_docente: number }>;
  docente_turma?: Array<{ id_docente: number; id_turma: number }>;
  docenteTurma?: Array<{ id_docente: number; id_turma: number }>;
}

interface UsuarioDB {
  id_usuario?: number;
  id?: number;
  id_docente?: number;
  nome: string;
  email: string;
  perfil?: string;
  status?: string;
  situacao?: string;
  tipo_usuario?: string;
  turma?: string;
  nif?: string;
  matricula?: string;
  aluno?: { id_aluno: number; id_turma: number; matricula?: string; situacao?: string };
  docente?: {
    id_docente: number;
    nif?: string;
    turmas?: TurmaDB[];
    docente_turma?: Array<{ id_docente: number; id_turma: number; turma?: TurmaDB }>;
    docenteTurma?: Array<{ id_docente: number; id_turma: number; turma?: TurmaDB }>;
  };
  administrador?: { id_adm: number; nif?: string };
  turmas?: TurmaDB[];
}

export function AccessControl({ notify }: { notify: (text: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UsuarioDB[]>([]);
  const [todasTurmas, setTodasTurmas] = useState<TurmaDB[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [filtroPerfil, setFiltroPerfil] = useState<string>("TODOS");

  // Modal 1: Novo Usuário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tipoNovo, setTipoNovo] = useState<"ALUNO" | "DOCENTE" | "ADMIN" | "ADMIN_PRINCIPAL">("ALUNO");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [idTurma, setIdTurma] = useState("1");
  const [matricula, setMatricula] = useState("");
  const [nif, setNif] = useState("");

  // Modal 2: Gerenciar Turmas do Docente
  const [selectedDocenteId, setSelectedDocenteId] = useState<number | null>(null);
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>("");
  const [loadingTurmas, setLoadingTurmas] = useState(false);

  // Modal 3: Confirmação de Desvinculação de Turma
  const [turmaToRemove, setTurmaToRemove] = useState<TurmaDB | null>(null);

  // Modal 4: Confirmação de Exclusão de Usuário
  const [userToDelete, setUserToDelete] = useState<UsuarioDB | null>(null);

  const fetchUsers = async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    let failedRequests = false;
    try {
      const [resUsers, resTurmas] = await Promise.all([
        api.get("/usuarios").catch(() => api.get("/users").catch((error) => {
          failedRequests = true;
          throw error;
        })),
        api.get("/turmas").catch(() => {
          failedRequests = true;
          return { data: [] };
        }),
      ]);

      if (Array.isArray(resUsers.data)) setUsers(resUsers.data);
      else if (resUsers.data?.usuarios) setUsers(resUsers.data.usuarios);

      if (Array.isArray(resTurmas.data)) setTodasTurmas(resTurmas.data);
      if (manual) notify(failedRequests ? "Acessos atualizados parcialmente. Algumas turmas não foram carregadas." : "Usuários e turmas atualizados.");
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      notify(manual ? "Não foi possível atualizar a lista de usuários." : "Erro ao carregar a lista de usuários.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getUserId = (u: UsuarioDB): number => u.id_usuario ?? u.id ?? 0;
  const getDocenteId = (u: UsuarioDB): number => u.docente?.id_docente ?? u.id_docente ?? getUserId(u);

  const getDocenteTurmas = (u: UsuarioDB): TurmaDB[] => {
    const direct = u.docente?.turmas || u.turmas || [];
    if (direct.length > 0) return direct;

    const pivo = u.docente?.docente_turma || u.docente?.docenteTurma || [];
    if (Array.isArray(pivo) && pivo.length > 0) {
      return pivo
        .map((p) => p.turma || todasTurmas.find((t) => t.id_turma === p.id_turma))
        .filter((t): t is TurmaDB => Boolean(t));
    }

    const docId = getDocenteId(u);
    if (docId && todasTurmas.length > 0) {
      const fromTurmas = todasTurmas.filter((t) => {
        const list = t.docentes || t.docente_turma || t.docenteTurma || [];
        return list.some((d) => d.id_docente === docId);
      });
      if (fromTurmas.length > 0) return fromTurmas;
    }

    return [];
  };

  const selectedDocente = selectedDocenteId !== null
    ? users.find((u) => getUserId(u) === selectedDocenteId) || null
    : null;

  const isMasterAdmin = (u: UsuarioDB): boolean => {
    const raw = String(u.perfil || u.tipo_usuario || "").toUpperCase();
    return raw.includes("PRINCIPAL") || raw === "ADMIN_PRINCIPAL";
  };

  const getUserTypeLabel = (u: UsuarioDB): string => {
    const raw = String(u.perfil || u.tipo_usuario || "").toUpperCase();
    if (isMasterAdmin(u)) return "★ Admin Principal";
    if (raw.includes("ADMIN") || u.administrador) return "Administrador";
    if (raw.includes("DOCENTE") || raw.includes("PROF") || u.docente) {
      const count = getDocenteTurmas(u).length;
      return count > 0 ? `Docente • ${count} turma(s)` : "Docente";
    }
    return "Aluno";
  };

  const getUserStatusLabel = (u: UsuarioDB): string => {
    const raw = String(u.status || u.situacao || u.aluno?.situacao || "ATIVO").toUpperCase();
    if (raw === "TRANCADO") return "Trancado";
    if (raw === "BLOQUEADO" || raw === "INATIVO") return "Bloqueado";
    return "Ativo";
  };

  const usuariosFiltrados = users.filter((u) => {
    if (filtroPerfil === "TODOS") return true;
    const label = getUserTypeLabel(u).toUpperCase();
    if (filtroPerfil === "DOCENTE") return label.includes("DOCENTE");
    if (filtroPerfil === "ADMIN") return label.includes("ADMIN");
    if (filtroPerfil === "ALUNO") return label.includes("ALUNO");
    return true;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return notify("Nome e e-mail são obrigatórios.");

    try {
      setSubmitting(true);
      const passwordToUse = senha.trim() || "senai123";
      const cleanEmail = email.trim().toLowerCase();

      let perfilMap = "ALUNO";
      if (tipoNovo === "ADMIN_PRINCIPAL") perfilMap = "ADMIN_PRINCIPAL";
      else if (tipoNovo === "ADMIN") perfilMap = "ADMINISTRADOR";
      else if (tipoNovo === "DOCENTE") perfilMap = "DOCENTE";

      const generatedNif = nif.trim() || (tipoNovo === "DOCENTE" ? `DOC-${Math.floor(1000 + Math.random() * 9000)}` : `ADM-${Math.floor(1000 + Math.random() * 9000)}`);

      const payload = {
        nome: nome.trim(),
        email: cleanEmail,
        senha: passwordToUse,
        perfil: perfilMap,
        id_turma: Number(idTurma) || 1,
        matricula: matricula.trim() || `AL-${Date.now()}`,
        nif: generatedNif,
      };

      await api.post("/usuarios", payload);

      notify(`Usuário ${nome} cadastrado com sucesso!`);
      setIsModalOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      notify(error?.response?.data?.message || "Erro ao cadastrar usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTurmaDocente = async () => {
    if (!selectedDocente || !selectedTurmaId) return;
    const docenteId = getDocenteId(selectedDocente);
    const idTurmaNum = Number(selectedTurmaId);

    setLoadingTurmas(true);
    try {
      await api.post(`/usuarios/docentes/${docenteId}/turmas`, {
        id_turma: idTurmaNum
      });

      notify("Turma vinculada ao docente com sucesso!");
      setSelectedTurmaId("");
      await fetchUsers();
    } catch (err: any) {
      console.error("Erro ao vincular turma:", err);
      notify(err?.response?.data?.message || "Erro ao vincular turma no servidor.");
    } finally {
      setLoadingTurmas(false);
    }
  };

  // Executado ao confirmar no modal customizado de desvinculação
  const handleConfirmRemoveTurma = async () => {
    if (!selectedDocente || !turmaToRemove) return;
    const docenteId = getDocenteId(selectedDocente);
    const idTurma = turmaToRemove.id_turma;

    setLoadingTurmas(true);
    try {
      await api.delete(`/usuarios/docentes/${docenteId}/turmas/${idTurma}`);
      notify("Turma desvinculada com sucesso!");
      setTurmaToRemove(null);
      await fetchUsers();
    } catch (err: any) {
      console.error("Erro ao desvincular turma:", err);
      notify(err?.response?.data?.message || "Erro ao desvincular turma no servidor.");
    } finally {
      setLoadingTurmas(false);
    }
  };

  const handleToggleBlock = async (u: UsuarioDB) => {
    const userId = getUserId(u);
    if (actionLoadingId === userId) return;
    setActionLoadingId(userId);

    const currentStatusLabel = getUserStatusLabel(u);
    const isCurrentlyBlocked = currentStatusLabel === "Trancado" || currentStatusLabel === "Bloqueado";
    const statusUsuario = isCurrentlyBlocked ? "ATIVO" : "BLOQUEADO";

    try {
      await api.patch(`/usuarios/${userId}/status`, { status: statusUsuario });
      notify(`Status de ${u.nome} atualizado.`);
      fetchUsers();
    } catch {
      notify("Erro ao atualizar status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const userId = getUserId(userToDelete);

    setActionLoadingId(userId);
    try {
      await api.delete(`/usuarios/${userId}`);
      notify(`Usuário excluído com sucesso!`);
      setUserToDelete(null);
      fetchUsers();
    } catch {
      notify("Erro ao excluir usuário.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const resetForm = () => {
    setNome("");
    setEmail("");
    setSenha("");
    setMatricula("");
    setNif("");
    setIdTurma("1");
    setTipoNovo("ALUNO");
  };

  return (
    <>
      <PageTitle
        eyebrow="SEGURANÇA E IDENTIDADE"
        title="Controle de acessos"
        text="Cadastre usuários e controle o bloqueio de acessos ao sistema."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <RefreshButton refreshing={refreshing} onRefresh={() => void fetchUsers(true)} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Filtrar por:</span>
              <select
                value={filtroPerfil}
                onChange={(e) => setFiltroPerfil(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#fff",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="DOCENTE">Docentes</option>
                <option value="ADMIN">Administradores</option>
                <option value="ALUNO">Alunos</option>
                <option value="TODOS">Todos os Acessos</option>
              </select>
            </div>

            <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
              <Icon name="plus" size={16} /> Novo usuário
            </button>
          </div>
        }
      />

      <article className="panel access-list" style={{ marginTop: "20px" }}>
        {loading ? (
          <p style={{ padding: "20px", color: "#64748b", textAlign: "center" }}>
            Carregando usuários do banco de dados...
          </p>
        ) : usuariosFiltrados.length > 0 ? (
          usuariosFiltrados.map((u) => {
            const userId = getUserId(u);
            const userType = getUserTypeLabel(u);
            const userStatus = getUserStatusLabel(u);
            const isBlocked = userStatus === "Trancado" || userStatus === "Bloqueado";
            const isDocente = userType.includes("Docente");
            const isMaster = isMasterAdmin(u);

            const initials = u.nome ? u.nome.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase() : "US";

            return (
              <div key={userId || u.email} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span className="avatar">{initials}</span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <b style={{ margin: 0 }}>{u.nome}</b>
                      {isMaster && (
                        <span style={{ backgroundColor: "#fef3c7", color: "#b45309", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", border: "1px solid #fde68a" }}>
                          ADMIN PRINCIPAL
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, marginTop: "4px" }}>
                      {u.email} <br /> {userType}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "290px", justifyContent: "flex-end" }}>
                  <span className={`access-status ${isBlocked ? "blocked" : ""}`}>
                    {userStatus}
                  </span>

                  {isDocente && (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setSelectedDocenteId(userId)}
                      style={{ margin: 0, whiteSpace: "nowrap" }}
                    >
                      Gerenciar Turmas
                    </button>
                  )}

                  <button
                    type="button"
                    className="block-btn"
                    onClick={() => handleToggleBlock(u)}
                    disabled={actionLoadingId === userId}
                    style={{
                      backgroundColor: isBlocked ? "#10b981" : undefined,
                      color: isBlocked ? "#fff" : undefined,
                      width: "105px",
                      textAlign: "center",
                      margin: 0
                    }}
                  >
                    {isBlocked ? (userType.includes("Aluno") ? "Destrancar" : "Desbloquear") : (userType.includes("Aluno") ? "Trancar" : "Bloquear")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserToDelete(u)}
                    title="Excluir usuário"
                    style={{ backgroundColor: "#fee2e2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", cursor: "pointer", flexShrink: 0 }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p style={{ padding: "20px", color: "#94a3b8", textAlign: "center" }}>
            Nenhum usuário encontrado para este filtro.
          </p>
        )}
      </article>

      {/* MODAL 1: CADASTRAR USUÁRIO */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div className="panel" style={modalContentStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Cadastrar Novo Usuário</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>

            <form onSubmit={handleCreateUser}>
              <label style={labelStyle}>
                Tipo de Perfil
                <select value={tipoNovo} onChange={(e) => setTipoNovo(e.target.value as any)} style={inputStyle}>
                  <option value="ALUNO">Aluno</option>
                  <option value="DOCENTE">Docente / Instrutor</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="ADMIN_PRINCIPAL">Administrador Principal</option>
                </select>
              </label>

              <label style={labelStyle}>
                Nome Completo
                <input type="text" required placeholder="Ex: João Silva" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
              </label>

              <label style={labelStyle}>
                E-mail Institucional
                <input type="email" required placeholder="Ex: joao@senai.br" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </label>

              {(tipoNovo === "ALUNO" || tipoNovo === "DOCENTE") && (
                <label style={labelStyle}>
                  ID da Turma
                  <input type="number" value={idTurma} onChange={(e) => setIdTurma(e.target.value)} placeholder="Ex: 1" style={inputStyle} required />
                </label>
              )}

              {tipoNovo === "ALUNO" && (
                <label style={labelStyle}>
                  Matrícula (opcional)
                  <input type="text" value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="Ex: AL-2024-001" style={inputStyle} />
                </label>
              )}

              {tipoNovo !== "ALUNO" && (
                <label style={labelStyle}>
                  NIF / Identificador (opcional)
                  <input type="text" value={nif} onChange={(e) => setNif(e.target.value)} placeholder={tipoNovo === "DOCENTE" ? "Ex: DOC-0003" : "Ex: ADM-0002"} style={inputStyle} />
                </label>
              )}

              <label style={labelStyle}>
                Senha Inicial (opcional, padrão: senai123)
                <input type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} style={inputStyle} />
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button type="button" className="secondary-btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="primary-btn" disabled={submitting}>{submitting ? "Cadastrando..." : "Cadastrar Usuário"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GERENCIAR TURMAS DO DOCENTE */}
      {selectedDocente && (
        <div style={modalOverlayStyle}>
          <div className="panel" style={{ ...modalContentStyle, maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#0f172a" }}>Turmas do Docente</h3>
                <small style={{ color: "#64748b" }}>{selectedDocente.nome}</small>
              </div>
              <button type="button" onClick={() => setSelectedDocenteId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Turmas Vinculadas</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", minHeight: "40px", padding: "8px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                {getDocenteTurmas(selectedDocente).length > 0 ? (
                  getDocenteTurmas(selectedDocente).map((t) => (
                    <span key={t.id_turma} style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#e0f2fe", color: "#0369a1", padding: "4px 10px", borderRadius: "14px", fontSize: "12px", fontWeight: 600 }}>
                      {t.codigo ? `${t.codigo} - ` : ""}{t.nome}
                      <button
                        type="button"
                        onClick={() => setTurmaToRemove(t)}
                        disabled={loadingTurmas}
                        title="Desvincular turma"
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "bold", fontSize: "12px", marginLeft: "2px" }}
                      >
                        ✕
                      </button>
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: "12px", color: "#94a3b8", alignSelf: "center" }}>Nenhuma turma vinculada a este docente.</span>
                )}
              </div>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <label style={labelStyle}>Vincular Nova Turma</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <select value={selectedTurmaId} onChange={(e) => setSelectedTurmaId(e.target.value)} style={{ ...inputStyle, marginTop: 0, marginBottom: 0, flex: 1 }}>
                  <option value="">Selecione uma turma...</option>
                  {todasTurmas
                    .filter((t) => !getDocenteTurmas(selectedDocente).some((v) => v.id_turma === t.id_turma))
                    .map((t) => (
                      <option key={t.id_turma} value={t.id_turma}>
                        {t.codigo ? `${t.codigo} - ` : ""}{t.nome}
                      </option>
                    ))}
                </select>

                <button type="button" className="primary-btn" onClick={handleAddTurmaDocente} disabled={!selectedTurmaId || loadingTurmas} style={{ padding: "6px 14px", height: "38px" }}>
                  {loadingTurmas ? "Salvando..." : "Adicionar"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button type="button" className="secondary-btn" onClick={() => setSelectedDocenteId(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMAÇÃO DE DESVINCULAÇÃO DE TURMA */}
      {turmaToRemove && selectedDocente && (
        <div style={{ ...modalOverlayStyle, zIndex: 1100 }}>
          <div className="panel" style={{ ...modalContentStyle, maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Desvincular Turma
              </h3>
              <button
                type="button"
                onClick={() => setTurmaToRemove(null)}
                disabled={loadingTurmas}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "#475569", marginBottom: "24px", lineHeight: "1.5" }}>
              Deseja desvincular a turma <strong>{turmaToRemove.codigo ? `${turmaToRemove.codigo} - ` : ""}{turmaToRemove.nome}</strong> do docente <strong>{selectedDocente.nome}</strong>?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setTurmaToRemove(null)}
                disabled={loadingTurmas}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveTurma}
                disabled={loadingTurmas}
                style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loadingTurmas ? "not-allowed" : "pointer",
                  opacity: loadingTurmas ? 0.7 : 1
                }}
              >
                {loadingTurmas ? "Desvinculando..." : "Desvincular"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EXCLUSÃO DE USUÁRIO */}
      {userToDelete && (
        <div style={modalOverlayStyle}>
          <div className="panel" style={{ ...modalContentStyle, maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Confirmar Exclusão</h3>
              <button type="button" onClick={() => setUserToDelete(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>

            <p style={{ fontSize: "14px", color: "#475569", marginBottom: "24px" }}>
              Tem certeza que deseja excluir o usuário "{userToDelete.nome}"?
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="secondary-btn" onClick={() => setUserToDelete(null)}>Cancelar</button>
              <button type="button" onClick={handleConfirmDelete} style={{ backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const modalOverlayStyle: React.CSSProperties = { position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" };
const modalContentStyle: React.CSSProperties = { width: "100%", maxWidth: "480px", backgroundColor: "#fff", padding: "24px", borderRadius: "12px" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, color: "#475569", marginBottom: "10px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", marginTop: "4px", outline: "none" };