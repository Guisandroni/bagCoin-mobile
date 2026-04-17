const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export interface PreRegisterResponse {
  status: string;
  token: string;
  id: number;
}

export const apiService = {
  async preRegister(name: string = "Novo Usuário"): Promise<PreRegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/users/pre-register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to pre-register token");
    }

    return response.json();
  },
};
