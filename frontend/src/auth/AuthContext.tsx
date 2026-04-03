import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  clearToken,
  getMe,
  getToken,
  login as loginRequest,
  type MeResponse,
} from "../api/auth";

type AuthContextType = {
  user: MeResponse | null;
  token: string | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(getToken());

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMe();
      setUser(me);
      setToken(getToken());
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    await loginRequest(identifier, password);
    setToken(getToken());
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, refreshUser, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}