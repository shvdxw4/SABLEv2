import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/auth";

export default function CreatorSignup() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signup(email, username, password, "creator");
            navigate("/creator-login");
        } catch (err: any) {
            setError(err.message || "Artist signup failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mx-auto max-w-md">
            <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight">Artist Sign Up</h1>
                <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
                    Create your artist account for the SABLE creator workspace.
                </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-sable-border dark:bg-sable-bg dark:text-sable-text dark:focus:border-sable-muted"
                            placeholder="artist@example.com"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium">Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-sable-border dark:bg-sable-bg dark:text-sable-text dark:focus:border-sable-muted"
                            placeholder="artistname"
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
                        {loading ? "Creating artist account…" : "Create Artist Account"}
                    </button>
                </form>

                <div className="mt-6">
                    <Link
                        to="/creator-login"
                        className="text-sm text-black/70 underline-offset-4 hover:underline dark:text-sable-muted"
                    >
                        Already have an artist account? Login
                    </Link>
                </div>
            </div>
        </div>
    );
}