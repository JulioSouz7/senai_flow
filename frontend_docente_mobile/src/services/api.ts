import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { LoginResponse, MobileSession } from '@/types/mobile';

const SESSION_KEY = 'senai_flow_session';
const LOCAL_API_URL = 'http://localhost:3001';

export const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || LOCAL_API_URL;
export const usesLocalApiFallback = apiBaseUrl === LOCAL_API_URL;

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

async function readSession(): Promise<string | null> {
  if (Platform.OS === 'web') return window.sessionStorage.getItem(SESSION_KEY);
  return SecureStore.getItemAsync(SESSION_KEY);
}

async function writeSession(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.sessionStorage.setItem(SESSION_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

async function removeSession(): Promise<void> {
  if (Platform.OS === 'web') {
    window.sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function login(email: string, senha: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/usuarios/login', { email, senha });
  return data;
}

api.interceptors.request.use(async (config) => {
  if (config.url === '/usuarios/login') return config;
  const stored = await readSession();
  if (stored) {
    const session = JSON.parse(stored) as MobileSession;
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

export async function getStoredSession(): Promise<MobileSession | null> {
  const stored = await readSession();
  if (!stored) return null;
  return JSON.parse(stored) as MobileSession;
}

export async function storeSession(session: MobileSession): Promise<void> {
  await writeSession(JSON.stringify(session));
}

export async function clearStoredSession(): Promise<void> {
  await removeSession();
}

export function getApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    const message = axiosError.response?.data?.message ?? axiosError.response?.data?.error;
    if (message) return message;
    if (!axiosError.response) {
      return `Não foi possível conectar à API em ${apiBaseUrl}. Confira a rede e a configuração EXPO_PUBLIC_API_URL.`;
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
