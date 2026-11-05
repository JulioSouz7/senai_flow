import { apiRequest } from "@/lib/api";
import type { LoginResponse } from "@/lib/types";

export const authService = {
  login(email: string, senha: string) {
    return apiRequest<LoginResponse>("/usuarios/login", { method: "POST", body: { email, senha } });
  },

  // Ajustado para apontar para a rota pública exata do backend
  requestPasswordReset(email: string) {
    return apiRequest<{ message: string }>("/usuarios/esqueci-senha", { method: "POST", body: { email } });
  },

  // Ajustado para apontar para a rota pública exata do backend
  resetPassword(token: string, nova_senha: string) {
    return apiRequest<{ message: string }>("/usuarios/redefinir-senha", {
      method: "POST",
      body: { token, nova_senha },
    });
  },

  changePassword(token: string, senha_atual: string, nova_senha: string) {
    return apiRequest<{ usuario: LoginResponse["usuario"] }>("/usuarios/alterar-senha", {
      method: "POST",
      token,
      body: { senha_atual, nova_senha },
    });
  },
};