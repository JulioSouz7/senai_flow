"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import type { AuthSession, Usuario } from "@/lib/types";
import { authService } from "@/services/authService";
import styles from "./AuthScreen.module.scss";

interface AuthScreenProps {
  onLogin: (email: string, senha: string) => Promise<void>;
  pendingSession: AuthSession | null;
  onPasswordChanged: (usuario: Usuario) => void;
}

export function AuthScreen({ onLogin, pendingSession, onPasswordChanged }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onLogin(email.trim(), senha);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível entrar."));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendingSession) return;
    if (novaSenha !== confirmacao) {
      toast.error("As senhas não correspondem.");
      return;
    }
    setSubmitting(true);
    try {
      const usuario = await authService.changePassword(pendingSession.token, senhaAtual, novaSenha);
      onPasswordChanged(usuario);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar a senha."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.authPage}>
      <div className={styles.authCanvas} aria-hidden="true" />
      <section className={styles.authCard}>
        <div className={styles.brandLine}><span className={styles.brandMark}>S</span><span>SENAI <strong>Flow</strong></span></div>
        {pendingSession ? (
          <>
            <p className={styles.eyebrow}>PRIMEIRO ACESSO</p>
            <h1>Crie sua nova senha</h1>
            <p className={styles.intro}>Atualize a senha provisória para continuar no portal.</p>
            <form className={styles.form} onSubmit={submitPassword}>
              <label>Senha atual<span className={styles.inputWrap}><LockKeyhole size={18} /><input type="password" autoComplete="current-password" value={senhaAtual} onChange={(event) => setSenhaAtual(event.target.value)} required /></span></label>
              <label>Nova senha<span className={styles.inputWrap}><LockKeyhole size={18} /><input type="password" autoComplete="new-password" value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} required /></span></label>
              <label>Confirme a nova senha<span className={styles.inputWrap}><LockKeyhole size={18} /><input type="password" autoComplete="new-password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} required /></span></label>
              <button className={styles.primaryButton} disabled={submitting}>{submitting ? "Salvando..." : "Atualizar senha"}<ArrowRight size={19} /></button>
            </form>
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>PORTAL DO ALUNO</p>
            <h1>Seu SENAI, mais perto.</h1>
            <p className={styles.intro}>Entre com suas credenciais institucionais.</p>
            <form className={styles.form} onSubmit={submitLogin}>
              <label>E-mail institucional<span className={styles.inputWrap}><Mail size={18} /><input type="email" autoComplete="username" placeholder="nome@aluno.senai.br" value={email} onChange={(event) => setEmail(event.target.value)} required /></span></label>
              <label>Senha<span className={styles.inputWrap}><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Sua senha" value={senha} onChange={(event) => setSenha(event.target.value)} required /><button className={styles.iconButton} type="button" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button></span></label>
              <button className={styles.primaryButton} disabled={submitting}>{submitting ? "Entrando..." : "Entrar na plataforma"}<ArrowRight size={19} /></button>
            </form>
            <div className={styles.secureNote}><ShieldCheck size={17} /><span>Acesso exclusivo da comunidade SENAI</span></div>
          </>
        )}
      </section>
      <div className={styles.sideNote} aria-hidden="true"><span>APRENDER</span><span>·</span><span>CRIAR</span><span>·</span><span>TRANSFORMAR</span></div>
    </main>
  );
}