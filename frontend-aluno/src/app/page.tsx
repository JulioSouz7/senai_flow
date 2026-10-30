"use client";

import { useState, useSyncExternalStore } from "react";
import { Toaster, toast } from "sonner";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { StudentPortal } from "@/features/student/StudentPortal";
import type { AuthSession, Usuario } from "@/lib/types";
import { clearSession, getServerSession, getSession, saveSession, subscribeSession } from "@/lib/sessionStore";
import { authService } from "@/services/authService";

export default function Home() {
  const session = useSyncExternalStore(subscribeSession, getSession, getServerSession);
  const [pendingSession, setPendingSession] = useState<AuthSession | null>(null);

  async function handleLogin(email: string, senha: string) {
    const result = await authService.login(email, senha);
    if (result.usuario.perfil !== "ALUNO") {
      throw new Error("Este portal é exclusivo para alunos.");
    }
    const nextSession = { token: result.token, usuario: result.usuario };
    if (result.requer_troca_senha) setPendingSession(nextSession);
    else saveSession(nextSession);
  }

  function handlePasswordChanged(usuario: Usuario) {
    if (!pendingSession) return;
    saveSession({ ...pendingSession, usuario });
    setPendingSession(null);
    toast.success("Senha atualizada. Bem-vindo ao SENAI Flow!");
  }

  function handleLogout() {
    clearSession();
    setPendingSession(null);
    toast.success("Logout realizado com sucesso!");
  }

  return <>
    <Toaster position="top-center" richColors />
    {session ? <StudentPortal session={session} onLogout={handleLogout} /> : <AuthScreen onLogin={handleLogin} pendingSession={pendingSession} onPasswordChanged={handlePasswordChanged} />}
  </>;
}
