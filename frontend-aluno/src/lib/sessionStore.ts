import type { AuthSession } from "@/lib/types";

const SESSION_KEY = "senai-flow-aluno-session";
let currentSession: AuthSession | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getSession() {
  if (typeof window === "undefined") return null;
  if (!hydrated) {
    hydrated = true;
    try {
      const saved = window.sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AuthSession;
        if (parsed.usuario.perfil === "ALUNO") currentSession = parsed;
        else window.sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      window.sessionStorage.removeItem(SESSION_KEY);
    }
  }
  return currentSession;
}

export function getServerSession() {
  return null;
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveSession(session: AuthSession) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  currentSession = session;
  hydrated = true;
  notify();
}

export function clearSession() {
  window.sessionStorage.removeItem(SESSION_KEY);
  currentSession = null;
  hydrated = true;
  notify();
}