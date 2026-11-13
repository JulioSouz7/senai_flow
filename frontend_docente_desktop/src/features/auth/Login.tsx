import { useEffect, useState, type FormEvent } from "react";
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
  const [successMessage, setSuccessMessage] = useState("");
  const [recoveryStage, setRecoveryStage] = useState<"login" | "request" | "reset">(() =>
    new URLSearchParams(window.location.search).has("token") ? "reset" : "login"
  );
  const [recoveryToken, setRecoveryToken] = useState(() =>
    new URLSearchParams(window.location.search).get("token") || ""
  );
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordConfirmation, setRecoveryPasswordConfirmation] = useState("");

  useEffect(() => {
    const message = sessionStorage.getItem("senai_logout_message");
    if (message) {
      setSuccessMessage(message);
      sessionStorage.removeItem("senai_logout_message");
    }
  }, []);
 
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/@(sp|aluno)\.senai\.br$/i.test(email)) {
      setError("Use seu e-mail educacional @sp.senai.br ou @aluno.senai.br.");
      return;
    }
 
    setError("");
    setSuccessMessage("");
    setLoading(true);
 
    try {
      const response = await api.post('/usuarios/login', {
        email: email,
        senha: password
      });
 
      const { token, usuario, requer_troca_senha } = response.data;
      if (usuario.perfil?.toUpperCase() !== "DOCENTE") {
        setError("Este aplicativo é destinado ao perfil docente.");
        return;
      }
     
      // Guarda o token e os dados do utilizador
      localStorage.setItem('senai_token', token);
      localStorage.setItem('senai_usuario', JSON.stringify(usuario));
 
      const roleTarget: Role = "teacher";
 
      if (requer_troca_senha || !usuario.senha_alterada) {
        setUserProfile(roleTarget);
        setFirstAccess(true);
        return;
      }
 
      setSuccessMessage("Login realizado com sucesso.");
      window.setTimeout(() => enter(roleTarget), 400);
 
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
 
      if (userProfile) {
        setSuccessMessage("Senha alterada com sucesso. Acessando o sistema...");
        window.setTimeout(() => enter(userProfile), 900);
      } else {
        setFirstAccess(false);
        setPassword("");
        setSuccessMessage("Senha alterada com sucesso.");
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

  const submitRecoveryRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Informe um e-mail institucional válido.");
      return;
    }
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/usuarios/esqueci-senha", { email: email.trim() });
      setSuccessMessage(data.mensagem || data.message || "Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.");
      setRecoveryStage("reset");
    } catch (err: any) {
      setError(err.response?.data?.message || "Não foi possível solicitar a recuperação de senha.");
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!recoveryToken.trim()) {
      setError("Informe o token recebido no e-mail de recuperação.");
      return;
    }
    if (recoveryPassword.length < 6) {
      setError("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (recoveryPassword !== recoveryPasswordConfirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/usuarios/redefinir-senha", {
        token: recoveryToken.trim(),
        nova_senha: recoveryPassword,
      });
      setSuccessMessage(data.mensagem || data.message || "Senha redefinida com sucesso. Entre com sua nova senha.");
      setRecoveryStage("login");
      setRecoveryToken("");
      setRecoveryPassword("");
      setRecoveryPasswordConfirmation("");
      window.history.replaceState({}, "", window.location.pathname);
    } catch (err: any) {
      setError(err.response?.data?.message || "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };
 // erro interno
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
            {successMessage && <p className="login-success" role="status">{successMessage}</p>}
           
            <button className="primary-btn" disabled={loading}>
              {loading ? "Salvando..." : "Salvar senha e acessar"}
            </button>
          </form>
        ) : recoveryStage === "request" ? (
          <form className="login-form" onSubmit={submitRecoveryRequest}>
            <small>RECUPERAÇÃO DE ACESSO</small>
            <h2>Esqueci minha senha</h2>
            <p>Informe seu e-mail institucional para solicitar as instruções de recuperação.</p>
            <label>E-mail institucional
              <input required type="email" placeholder="email@sp.senai.br" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {error && <p className="login-error" role="alert">{error}</p>}
            {successMessage && <p className="login-success" role="status">{successMessage}</p>}
            <button className="primary-btn" disabled={loading}>{loading ? "Enviando..." : "Enviar instruções"}</button>
            <button type="button" className="text-link" onClick={() => { setError(""); setSuccessMessage(""); setRecoveryStage("login"); }}>Voltar ao login</button>
          </form>
        ) : recoveryStage === "reset" ? (
          <form className="login-form" onSubmit={submitPasswordReset}>
            <small>RECUPERAÇÃO DE ACESSO</small>
            <h2>Redefinir senha</h2>
            <p>Informe o token recebido por e-mail e escolha uma nova senha.</p>
            <label>Token de recuperação
              <input required value={recoveryToken} onChange={(e) => setRecoveryToken(e.target.value)} />
            </label>
            <label>Nova senha
              <input required minLength={6} type="password" value={recoveryPassword} onChange={(e) => setRecoveryPassword(e.target.value)} />
            </label>
            <label>Confirmar nova senha
              <input required minLength={6} type="password" value={recoveryPasswordConfirmation} onChange={(e) => setRecoveryPasswordConfirmation(e.target.value)} />
            </label>
            {error && <p className="login-error" role="alert">{error}</p>}
            {successMessage && <p className="login-success" role="status">{successMessage}</p>}
            <button className="primary-btn" disabled={loading}>{loading ? "Redefinindo..." : "Redefinir senha"}</button>
            <button type="button" className="text-link" onClick={() => { setError(""); setSuccessMessage(""); setRecoveryStage("login"); }}>Voltar ao login</button>
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
            {successMessage && <p className="login-success" role="status">{successMessage}</p>}
           
            <button className="primary-btn" disabled={loading}>
              {loading ? "Entrando..." : <>Entrar na plataforma <Icon name="arrow" size={16} /></>}
            </button>
            <button type="button" className="text-link" onClick={() => { setError(""); setSuccessMessage(""); setRecoveryStage("request"); }}>
              Esqueci minha senha
            </button>
            <div className="secure-note"><Icon name="check" size={14} /> Acesso exclusivo da comunidade SENAI</div>
          </form>
        )}
      </section>
    </main>
  );
}