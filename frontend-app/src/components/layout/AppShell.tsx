import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { Icon } from "../../components/icons/Icon";
import { type Role } from "../../types"; // Removi o 'profiles' daqui, pois não usaremos mais dados fixos
import { Brand } from "../ui/Brand";
import { RoleMenu } from "../ui/RoleMenu";
 
const managementNav = [["grid","Dashboard"],["clock","Validação de reservas"],["box","Solicitações de equipamentos"],["tool","Gestão de avarias"],["settings","Cadastros"],["message","Comunicados"],["message","Relatos e sugestões"],["users","Controle de acessos"],["map","Mapa de riscos"]];
const teacherNav = [["calendar","Agenda de salas"],["building","Minhas reservas"],["box","Solicitação de equipamentos"],["tool","Relatórios de avaria"],["trophy","Ranking de turmas"],["map","Mapa de riscos"],["message","FAQs e sugestões"]];
 
export function AppShell({ role, roleChange, active, setActive, children }: { role: "teacher" | "management"; roleChange: (role: Role) => void; active: number; setActive: (n: number) => void; children: ReactNode }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const nav = role === "management" ? managementNav : teacherNav;
 
  // 1. Criamos um estado para guardar os dados reais do banco
  const [currentUser, setCurrentUser] = useState<any>(null);
 
  // 2. Buscamos o usuário no localStorage assim que a tela carrega
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("senai_usuario");
    if (usuarioSalvo) {
      setCurrentUser(JSON.parse(usuarioSalvo));
    }
  }, []);
 
  // 3. Função para pegar as iniciais do nome real (Ex: Edgard Coutinho -> EC)
  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };
 
  // 4. Função de logout real (limpando o storage)
  const handleLogout = () => {
    localStorage.removeItem("senai_token");
    localStorage.removeItem("senai_usuario");
    window.location.reload();
  };
 
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand/>
        <div className="sidebar-unit"><span>Unidade</span><b>SENAI Almirante Tamandaré</b><small>Bloco D • Piloto</small></div>
        <nav>{nav.map(([icon,label], index) => <button className={active === index ? "active" : ""} onClick={() => setActive(index)} key={label}><Icon name={icon}/><span>{label}</span>{index === 1 && role === "management" && <i>3</i>}</button>)}</nav>
        <div className="official"><Icon name="check" size={16}/><span>Canal institucional oficial</span></div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="mobile-brand"><Brand/></div>
          <label className="search"><Icon name="search" size={17}/><input placeholder="Buscar salas, chamados ou patrimônio..."/></label>
          <div className="header-actions">
           
            {/* Botão de sair do sistema atualizado para limpar o localStorage */}
            <button className="icon-btn" onClick={handleLogout} title="Sair do sistema">
              <Icon name="logout" size={19}/>
            </button>
           
            <button className="icon-btn"><Icon name="bell" size={19}/><i/></button>
           
            {/* BOTÃO DO PERFIL DINÂMICO */}
            <button className="profile" onClick={() => setProfileOpen(!profileOpen)}>
              <span className="avatar">
                {currentUser ? getInitials(currentUser.nome) : "US"}
              </span>
              <span>
                <b>{currentUser ? currentUser.nome : "Carregando..."}</b>
                <small>{currentUser ? currentUser.perfil : ""}</small>
              </span>
              <Icon name="arrow" size={14}/>
            </button>
           
            {/* O RoleMenu agora só precisa receber a função de fechar */}
            {profileOpen && <RoleMenu close={() => setProfileOpen(false)}/>}
           
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
      <nav className="bottom-nav">{nav.slice(0,4).map(([icon,label],index) => <button className={active === index ? "active" : ""} onClick={() => setActive(index)} key={label}><Icon name={icon}/><span>{label.split(" ")[0]}</span></button>)}</nav>
    </div>
  );
}