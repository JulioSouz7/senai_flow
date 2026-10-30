import { useState, type FormEvent } from "react";
import { Brand } from "../../components/ui/Brand";
import { type Role } from "../../types";
import { Icon } from "../../components/icons/Icon";
import { api } from "../../services/api";
 
export function Login({ enter }: { enter: (role: Role) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [firstAccess, setFirstAccess] = useState(false);
 
  const [userProfile, setUserProfile] = useState<Role | null>(null);
 
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
 
  const mapPerfilToRole = (perfilBackend: string): Role => {
    const perfil = perfilBackend?.toUpperCase();
    switch (perfil) {
      case "ADMINISTRADOR":
      case "GESTAO":
        return "management";
      case "DOCENTE":
        return "teacher";
      case "ALUNO":
        return "student";
      default:
        return "student";
    }
  };
 
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/@(sp|aluno)\.senai\.br$/i.test(email)) {
      setError("Use seu e-mail educacional @sp.senai.br ou @aluno.senai.br.");
      return;
    }
 
    setError("");
    setLoading(true);
 
    try {
      const response = await api.post('/usuarios/login', {
        email: email,
        senha: password
      });
 
      const { token, usuario, requer_troca_senha } = response.data;
     
      // Guarda o token e os dados do utilizador
      localStorage.setItem('senai_token', token);
      localStorage.setItem('senai_usuario', JSON.stringify(usuario));
 
      const roleTarget = mapPerfilToRole(usuario.perfil);
 
      if (requer_troca_senha || !usuario.senha_alterada) {
        setUserProfile(roleTarget);
        setFirstAccess(true);
        return;
      }
 
      enter(roleTarget);
 
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
 
      // Personalização da mensagem de erro de senha incorreta
      if (backendMessage === "Senha inválida") {
        setError("Senha incorreta. Verifique os dados e tente novamente.");
      } else if (backendMessage === "Usuário não encontrado") {
        setError("E-mail não cadastrado na plataforma.");
      } else {
        setError(backendMessage || "Erro ao conectar com o servidor.");
      }
    } finally {
      setLoading(false);
    }
  };
 
  const submitNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem. Tente novamente.");
      return;
    }
 
    setPasswordError("");
    setLoading(true);
 
    try {
      await api.post('/usuarios/alterar-senha', {
        senha_atual: password,
        nova_senha: newPassword
      });
 
      alert("Senha alterada com sucesso!");
 
      if (userProfile) {
        enter(userProfile);
      } else {
        setFirstAccess(false);
        setPassword("");
      }
 
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
 
      if (backendMessage === "Senha atual incorreta") {
        setPasswordError("A senha provisória informada está incorreta.");
      } else {
        setPasswordError(backendMessage || "Erro ao atualizar senha.");
      }
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <main className="login-page">
      <section className="login-brand">
        <Brand />
        <div>
          <span>SENAI ALMIRANTE TAMANDARÉ</span>
          <h1>Espaços que fluem.<br />Ensino que transforma.</h1>
          <p>Reservas, conservação, segurança e comunicação em um único canal institucional.</p>
        </div>
        <small>Serviço Nacional de Aprendizagem Industrial</small>
      </section>
 
      <section className="login-form-wrap">
        {firstAccess ? (
          <form className="login-form" onSubmit={submitNewPassword}>
            <span className="login-icon"><Icon name="settings" /></span>
            <small>PRIMEIRO ACESSO</small>
            <h2>Crie uma nova senha</h2>
            <p>A senha temporária precisa ser substituída antes de continuar.</p>
            <label>Nova senha
              <input required minLength={8} type="password" placeholder="Mínimo de 8 caracteres" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </label>
            <label>Confirmar nova senha
              <input required minLength={8} type="password" placeholder="Repita a nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </label>
            {passwordError && <p className="login-error">{passwordError}</p>}
           
            <button className="primary-btn" disabled={loading}>
              {loading ? "Salvando..." : "Salvar senha e acessar"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={submit}>
            <small>PORTAL INSTITUCIONAL</small>
            <h2>Bem-vindo ao SENAI Flow</h2>
            <p>Acesse usando suas credenciais educacionais.</p>
            <label>E-mail institucional
              <input required type="email" placeholder="email@sp.senai.br" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>Senha
              <input required type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
 
            {error && <p className="login-error">{error}</p>}
           
            <button className="primary-btn" disabled={loading}>
              {loading ? "Entrando..." : <>Entrar na plataforma <Icon name="arrow" size={16} /></>}
            </button>
            <div className="secure-note"><Icon name="check" size={14} /> Acesso exclusivo da comunidade SENAI</div>
          </form>
        )}
      </section>
    </main>
  );
}