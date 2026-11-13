import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Icon } from "../../components/icons/Icon";
import { type Role } from "../../types";
import { Brand } from "../ui/Brand";
import { RoleMenu } from "../ui/RoleMenu";
import { api } from "../../services/api";
import { CircleAlert } from "lucide-react";

const managementNav = [
  ["grid", "Dashboard"],
  ["clock", "Validação de reservas"],
  ["box", "Solicitações de equipamentos"],
  ["tool", "Gestão de avarias"],
  ["settings", "Cadastro de ativos"],
  ["circleAlert", "Comunicados"],
  ["message", "Relatos e sugestões"],
  ["users", "Controle de acessos"],
  ["map", "Mapa de riscos"],
  ["message", "FAQ & Suporte"]
];

const teacherNav = [
  ["calendar", "Agenda de salas"],
  ["building", "Minhas reservas"],
  ["box", "Solicitação de equipamentos"],
  ["tool", "Relatórios de avaria"],
  ["trophy", "Ranking de turmas"],
  ["map", "Mapa de riscos"],
  ["message", "FAQs e sugestões"]
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
        <nav style={{ overflowY: "auto", maxHeight: "calc(100vh - 220px)", paddingRight: "4px" }}>
          {nav.map(([icon, label], index) => (
            <button
              className={active === index ? "active" : ""}
              onClick={() => setActive(index)}
              key={label}
            >
              {icon === "circleAlert" ? <CircleAlert size={20} strokeWidth={1.8} /> : <Icon name={icon} />}
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

          {/* Mantém a estrutura 'search' invisível para sustentar o flexbox na direita */}
          <div className="search" style={{ visibility: "hidden" }} />

          <div className="header-actions">
            <button className="icon-btn" onClick={handleLogout} title="Sair do sistema">
              <Icon name="logout" size={19} />
            </button>

            {/* Ícone de notificação (sino) removido aqui */}

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