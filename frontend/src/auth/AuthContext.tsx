import { createContext, useContext, useEffect, useState } from "react";
import { clearToken, getMe, type MeResponse } from "../api/auth";

type AuthContextType = {
  user: MeResponse | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    setLoading(true);
    try {
      const me = await getMe();
      setUser(me);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
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