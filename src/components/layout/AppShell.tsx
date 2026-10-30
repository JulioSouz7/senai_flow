import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Icon } from "../../components/icons/Icon";
import { type Role } from "../../types";
import { Brand } from "../ui/Brand";
import { RoleMenu } from "../ui/RoleMenu";
import { api } from "../../services/api";
 
const managementNav = [
  ["grid", "Dashboard"],
  ["clock", "Validação de reservas"],
  ["box", "Solicitações de equipamentos"],
  ["tool", "Gestão de avarias"],
  ["settings", "Cadastros"],
  ["message", "Comunicados"],
  ["message", "Relatos e sugestões"],
  ["users", "Controle de acessos"],
  ["map", "Mapa de riscos"]
];
 
// Adicionamos a opção Comunicados na posição índice 6 do menu docente
const teacherNav = [
  ["calendar", "Agenda de salas"],         // 0
  ["building", "Minhas reservas"],         // 1
  ["box", "Solicitação de equipamentos"],  // 2
  ["trophy", "Ranking de turmas"],         // 3
  ["map", "Mapa de riscos"],               // 4
  ["message", "FAQs e sugestões"],         // 5
  ["bell", "Comunicados"]                  // 6
];
 
export function AppShell({
  role,
  roleChange,
  active,
  setActive,
  children
}: {
  role: "teacher" | "management";
  roleChange: (role: Role) => void;
  active: number;
  setActive: (n: number) => void;
  children: ReactNode;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const nav = role === "management" ? managementNav : teacherNav;
 
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
 
  // 1. Busca os dados do usuário autenticado no localStorage
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("senai_usuario");
    if (usuarioSalvo) {
      setCurrentUser(JSON.parse(usuarioSalvo));
    }
  }, []);
 
  // 2. Consulta o total real de reservas pendentes no backend
  useEffect(() => {
    async function fetchPendingCount() {
      if (role !== "management") return;
      try {
        const response = await api.get("/reservas/pendentes");
        if (Array.isArray(response.data)) {
          setPendingCount(response.data.length);
        }
      } catch (error) {
        try {
          const res = await api.get("/reservas");
          if (Array.isArray(res.data)) {
            const count = res.data.filter((r: any) => r.status === "PENDENTE").length;
            setPendingCount(count);
          }
        } catch (err) {
          console.error("Erro ao buscar pendências do menu:", err);
        }
      }
    }
 
    fetchPendingCount();
 
    const interval = setInterval(fetchPendingCount, 10000);
    return () => clearInterval(interval);
  }, [role, active]);
 
  // 3. Iniciais do nome do usuário
  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };
 
  // 4. Logout do sistema
  const handleLogout = () => {
    localStorage.removeItem("senai_token");
    localStorage.removeItem("senai_usuario");
    window.location.reload();
  };
 
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-unit">
          <span>Unidade</span>
          <b>SENAI Almirante Tamandaré</b>
          <small>Bloco D • Piloto</small>
        </div>
        <nav>
          {nav.map(([icon, label], index) => (
            <button
              className={active === index ? "active" : ""}
              onClick={() => setActive(index)}
              key={label}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {index === 1 && role === "management" && pendingCount > 0 && (
                <i>{pendingCount}</i>
              )}
            </button>
          ))}
        </nav>
        <div className="official">
          <Icon name="check" size={16} />
          <span>Canal institucional oficial</span>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <label className="search">
            <Icon name="search" size={17} />
            <input placeholder="Buscar salas, chamados ou patrimônio..." />
          </label>
          <div className="header-actions">
            <button className="icon-btn" onClick={handleLogout} title="Sair do sistema">
              <Icon name="logout" size={19} />
            </button>
 
            {/* BOTÃO DO SINO: Direciona para a página de Comunicados (índice 6 no perfil docente ou 5 no perfil gestão) */}
            <button
              className="icon-btn"
              onClick={() => setActive(role === "management" ? 5 : 6)}
              title="Ver Comunicados"
            >
              <Icon name="bell" size={19} />
              <i />
            </button>
 
            <button className="profile" onClick={() => setProfileOpen(!profileOpen)}>
              <span className="avatar">
                {currentUser ? getInitials(currentUser.nome) : "US"}
              </span>
              <span>
                <b>{currentUser ? currentUser.nome : "Carregando..."}</b>
                <small>{currentUser ? currentUser.perfil : ""}</small>
              </span>
              <Icon name="arrow" size={14} />
            </button>
 
            {profileOpen && <RoleMenu close={() => setProfileOpen(false)} />}
          </div>
        </header>
        <main className="content">{children}</main>
      </div>

      <nav className="bottom-nav">
        {nav.slice(0, 4).map(([icon, label], index) => (
          <button
            className={active === index ? "active" : ""}
            onClick={() => setActive(index)}
            key={label}
          >
            <Icon name={icon} />
            <span>{label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}