import { api, withToken } from "@/lib/api";
import type { AuthResponse, Usuario } from "@/lib/types";

export const authService = {
  async login(email: string, senha: string) {
    const { data } = await api.post<AuthResponse>("/usuarios/login", { email, senha });
    return data;
  },

  async changePassword(token: string, senha_atual: string, nova_senha: string) {
    const { data } = await api.post<{ usuario: Usuario }>(
      "/usuarios/alterar-senha",
      { senha_atual, nova_senha },
      withToken(token),
    );
    return data.usuario;
  },
};