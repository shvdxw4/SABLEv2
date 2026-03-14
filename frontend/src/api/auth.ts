import { API_BASE_URL } from "../config";

export type AuthResponse = {
  access_token: string;
  token_type: string;
};

export type MeResponse = {
  id: number;
  email: string;
  username: string;
  role: string;
};

const TOKEN_KEY = "access_token";

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(identifier: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Login failed");
  }

  setToken(data.access_token);
  return data;
}

export async function signup(email: string, username: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, username, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Signup failed");
  }

  return data;
}

export async function getMe(): Promise<MeResponse | null> {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearToken();
    return null;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Failed to fetch current user");
  }

  return data;
}