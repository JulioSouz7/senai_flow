const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3001").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, options: { method?: string; token?: string; body?: unknown } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) {
    throw new ApiError(payload?.message || "Não foi possível concluir a solicitação.", response.status);
  }
  return payload as T;
}

export const apiBaseUrl = API_BASE_URL;