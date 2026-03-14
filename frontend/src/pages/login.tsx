import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMe, login } from "../api/auth";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(identifier, password);
      await refreshUser();
      const me = await getMe();

      if (!me) {
        throw new Error("Could not load current user");
      }

      if (me.role === "creator") {
        navigate("/creator");
      } else {
        navigate("/library");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Login</h1>
        <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
          Sign in to access your SABLE space.
        </p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email or Username</label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-sable-border dark:bg-sable-bg dark:text-sable-text dark:focus:border-sable-muted"
              placeholder="you@example.com or username"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-sable-border dark:bg-sable-bg dark:text-sable-text dark:focus:border-sable-muted"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sable-text dark:text-sable-bg"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="mt-6">
          <Link
            to="/signup"
            className="text-sm text-black/70 underline-offset-4 hover:underline dark:text-sable-muted"
          >
            Need an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}