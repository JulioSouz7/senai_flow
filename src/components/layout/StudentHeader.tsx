import { useState, useEffect } from "react";
import { Icon } from "../icons/Icon";
import { Brand } from "../ui/Brand";
import { RoleMenu } from "../ui/RoleMenu";
 
export function StudentHeader() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
 
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("senai_usuario");
    if (usuarioSalvo) {
      setCurrentUser(JSON.parse(usuarioSalvo));
    }
  }, []);
 
  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };
 
  const handleLogout = () => {
    localStorage.removeItem("senai_token");
    localStorage.removeItem("senai_usuario");
    window.location.reload();
  };
 
  return (
    <header className="student-header">
      <Brand />
     
      <div className="header-actions">
        {/* Botão de Sair do sistema */}
        <button className="icon-btn" onClick={handleLogout} title="Sair do sistema">
          <Icon name="logout" size={19} />
        </button>
 
        {/* Notificações */}
        <button className="icon-btn">
          <Icon name="bell" size={19} />
          <i />
        </button>
 
        {/* Botão do Perfil com iniciais dinâmicas */}
        <button className="profile" onClick={() => setProfileOpen(!profileOpen)}>
          <span className="avatar">
            {currentUser ? getInitials(currentUser.nome) : "US"}
          </span>
        </button>
 
        {/* Dropdown 'Minha Conta' */}
        {profileOpen && <RoleMenu close={() => setProfileOpen(false)} />}
      </div>
    </header>
  );
}