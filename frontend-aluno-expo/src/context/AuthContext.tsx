import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";
import type { PropsWithChildren } from "react";
import { Platform } from "react-native";
import type { AuthSession } from "@/lib/types";
import { authService } from "@/services/authService";

const SESSION_KEY = "senai-flow-aluno-session";

function readStoredSession() {
  return Platform.OS === "web"
    ? Promise.resolve(typeof window === "undefined" ? null : window.sessionStorage.getItem(SESSION_KEY))
    : SecureStore.getItemAsync(SESSION_KEY);
}

function writeStoredSession(value: string) {
  if (Platform.OS === "web") window.sessionStorage.setItem(SESSION_KEY, value);
  else return SecureStore.setItemAsync(SESSION_KEY, value);
}

function deleteStoredSession() {
  if (Platform.OS === "web") window.sessionStorage.removeItem(SESSION_KEY);
  else return SecureStore.deleteItemAsync(SESSION_KEY);
}

interface AuthContextValue {
  session: AuthSession | null;
  pendingSession: AuthSession | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ requiresPasswordChange: boolean }>;
  changePassword: (senhaAtual: string, novaSenha: string) => Promise<void>;
  saveSession: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [pendingSession, setPendingSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    readStoredSession()
      .then((saved) => {
        if (!active || !saved) return;
        const parsed = JSON.parse(saved) as AuthSession;
        if (parsed.usuario.perfil === "ALUNO" && parsed.token) setSession(parsed);
        else void deleteStoredSession();
      })
      .catch(() => deleteStoredSession())
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveSession(nextSession: AuthSession) {
    await writeStoredSession(JSON.stringify(nextSession));
    setSession(nextSession);
  }

  async function login(email: string, senha: string) {
    const result = await authService.login(email, senha);
    if (result.usuario.perfil !== "ALUNO") throw new Error("Este app é exclusivo para alunos.");
    const nextSession = { token: result.token, usuario: result.usuario };
    if (result.requer_troca_senha) setPendingSession(nextSession);
    else await saveSession(nextSession);
    return { requiresPasswordChange: result.requer_troca_senha };
  }

  async function changePassword(senhaAtual: string, novaSenha: string) {
    if (!pendingSession) throw new Error("Sessão de primeiro acesso não encontrada.");
    const result = await authService.changePassword(pendingSession.token, senhaAtual, novaSenha);
    await saveSession({ ...pendingSession, usuario: result.usuario });
    setPendingSession(null);
  }

  async function logout() {
    await deleteStoredSession();
    setSession(null);
  }

  return <AuthContext.Provider value={{ session, pendingSession, loading, login, changePassword, saveSession, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}