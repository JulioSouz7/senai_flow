"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import { authService } from "@/services/authService";
import styles from "./AuthScreen.module.scss";

interface PasswordRecoveryScreenProps {
  mode: "request" | "reset";
  initialToken?: string;
}

export function PasswordRecoveryScreen({ mode, initialToken = "" }: PasswordRecoveryScreenProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(initialToken);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "request") {
        const result = await authService.requestPasswordReset(email.trim());
        setSubmitted(true);
        toast.success(result.message);
      } else {
        if (novaSenha !== confirmacao) {
          toast.error("As senhas não correspondem.");
          return;
        }
        await authService.resetPassword(token.trim(), novaSenha);
        toast.success("Senha redefinida com sucesso. Entre com sua nova senha.");
        router.replace("/");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível concluir a solicitação."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.authPage}>
      <div className={styles.authCanvas} aria-hidden="true" />
      <section className={styles.authCard}>
        <div className={styles.brandLine}><span className={styles.brandMark}>S</span><span>SENAI <strong>Flow</strong></span></div>
        <p className={styles.eyebrow}>RECUPERAÇÃO DE ACESSO</p>
        <h1>{mode === "request" ? "Esqueceu sua senha?" : "Crie uma nova senha"}</h1>
        <p className={styles.intro}>{mode === "request" ? "Informe seu e-mail institucional. Se ele estiver cadastrado, enviaremos as instruções." : "O link é válido por 30 minutos e pode ser usado uma única vez."}</p>
        {mode === "request" && submitted ? (
          <div className={styles.recoveryNotice} role="status">Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.</div>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            {mode === "request" ? (
              <label>E-mail institucional<span className={styles.inputWrap}><Mail size={18} /><input type="email" autoComplete="email" placeholder="nome@aluno.senai.br" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={150} required /></span></label>
            ) : <>
              {!token && <label>Token recebido por e-mail<span className={styles.inputWrap}><KeyRound size={18} /><input value={token} onChange={(event) => setToken(event.target.value)} autoComplete="one-time-code" required /></span></label>}
              <label>Nova senha<span className={styles.inputWrap}><KeyRound size={18} /><input type="password" autoComplete="new-password" value={novaSenha} onChange={(event) => setNovaSenha(event.target.value)} minLength={8} maxLength={72} required /></span></label>
              <label>Confirme a nova senha<span className={styles.inputWrap}><KeyRound size={18} /><input type="password" autoComplete="new-password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} minLength={8} maxLength={72} required /></span></label>
            </>}
            <button className={styles.primaryButton} disabled={submitting || (mode === "reset" && !token.trim())}>
              {submitting ? "Aguarde..." : mode === "request" ? "Enviar instruções" : "Redefinir senha"}
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </form>
        )}
        <Link className={styles.forgotLink} href="/"><ArrowLeft size={15} aria-hidden="true" />Voltar ao login</Link>
      </section>
      <div className={styles.sideNote} aria-hidden="true"><span>APRENDER</span><span>·</span><span>CRIAR</span><span>·</span><span>TRANSFORMAR</span></div>
    </main>
  );
}