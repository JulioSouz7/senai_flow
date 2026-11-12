import { useEffect, useState, useRef } from "react";
import { api } from "../../services/api";
 
export function RoleMenu({
  close,
  usuario,
}: {
  close: () => void;
  usuario: { nome?: string; email?: string; perfil?: string } | null;
}) {
  const [turmas, setTurmas] = useState<Array<{ nome: string; curso: string }>>([]);
  const [turmasError, setTurmasError] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
 
  useEffect(() => {
    if (usuario?.perfil?.toUpperCase() === "DOCENTE") {
      api.get<Array<{ nome: string; curso: string }>>("/turmas")
        .then(({ data }) => setTurmas(Array.isArray(data) ? data : []))
        .catch((error: unknown) => {
          setTurmasError(error instanceof Error ? error.message : "Não foi possível carregar as turmas.");
        });
    }
 
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        close();
      }
    }
 
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [close, usuario?.perfil]);
 
  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };
 
  return (
    <div className="role-menu" role="dialog" aria-modal="true" aria-label="Informações do docente" ref={menuRef}>
      <p>INFORMAÇÕES DO DOCENTE</p>
     
      {usuario && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
          <span className="avatar">{getInitials(usuario.nome ?? "")}</span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <b style={{ color: '#1a1a1a' }}>{usuario.nome}</b>
            <small style={{ color: '#666' }}>{usuario.perfil}</small>
            {usuario.email ? <small style={{ color: '#666' }}>{usuario.email}</small> : null}
          </span>
        </div>
      )}
      {usuario?.perfil?.toUpperCase() === "DOCENTE" ? (
        <div className="profile-class-list">
          <b>Turmas e cursos</b>
          {turmasError ? <small role="alert">{turmasError}</small> : null}
          {!turmasError && turmas.length === 0 ? <small>Nenhuma turma vinculada.</small> : null}
          {turmas.map((turma, index) => (
            <small key={`${turma.nome}-${index}`}>{turma.nome} · {turma.curso}</small>
          ))}
        </div>
      ) : null}
    </div>
  );
}