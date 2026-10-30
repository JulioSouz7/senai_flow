import { useEffect, useState, useRef } from "react";
 
export function RoleMenu({ close }: { close: () => void }) {
  const [usuario, setUsuario] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    // 1. Procura os dados do utilizador autenticado
    const usuarioSalvo = localStorage.getItem("senai_usuario");
    if (usuarioSalvo) {
      setUsuario(JSON.parse(usuarioSalvo));
    }
 
    // 2. Evento para fechar ao clicar fora do componente
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        close();
      }
    }
 
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [close]);
 
  // Função auxiliar para gerar as iniciais
  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };
 
  return (
    <div className="role-menu" ref={menuRef}>
      <p>MINHA CONTA</p>
     
      {usuario && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
          <span className="avatar">{getInitials(usuario.nome)}</span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <b style={{ color: '#1a1a1a' }}>{usuario.nome}</b>
            <small style={{ color: '#666' }}>{usuario.perfil}</small>
          </span>
        </div>
      )}
    </div>
  );
}