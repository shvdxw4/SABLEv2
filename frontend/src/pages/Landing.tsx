import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchHealth } from "../api/health";

type HealthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; message: string }
  | { status: "error"; detail: string };

export default function Landing() {
  const [health, setHealth] = useState<HealthState>({ status: "idle" });

  useEffect(() => {
    let alive = true;

    async function run() {
      setHealth({ status: "loading" });
      try {
        const data = await fetchHealth();
        if (!alive) return;
        setHealth({ status: "ok", message: data.message });
      } catch (e: any) {
        if (!alive) return;
        setHealth({
          status: "error",
          detail: e?.message ?? "Unknown error",
        });
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      {/* HERO */}
      <div className="mb-8">
        <h1 className="text-6xl font-semibold tracking-tight">
          A creator&apos;s private vault.
        </h1>

        <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-sable-muted">
          Upload drafts. Preview waveforms. Share for fast feedback. Keep your
          ideas organized.
        </p>

        {/* BACKEND HEALTH */}
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-4 text-sm dark:border-sable-border dark:bg-sable-panel">
          {health.status === "loading" && (
            <p className="text-black/70 dark:text-sable-muted">
              Checking backend…
            </p>
          )}

          {health.status === "ok" && (
            <p className="text-black/70 dark:text-sable-muted">
              Backend:{" "}
              <span className="font-medium text-black dark:text-sable-text">
                Healthy
              </span>{" "}
              — {health.message}
            </p>
          )}

          {health.status === "error" && (
            <p className="text-black/70 dark:text-sable-muted">
              Backend:{" "}
              <span className="font-medium text-red-600">Error</span> —{" "}
              {health.detail}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 dark:bg-sable-text dark:text-sable-bg"
          >
            Enter SABLE
          </Link>

          <Link
            to="/login"
            className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium text-black transition hover:border-black/30 dark:border-sable-border dark:text-sable-text dark:hover:border-sable-muted"
          >
            Creator login
          </Link>
        </div>
      </div>

      {/* FEATURE GRID */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
          <p className="text-sm text-black/60 dark:text-sable-muted">Next</p>
          <p className="mt-2 text-lg font-medium">Upload</p>
          <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
            Drop an mp3/wav and instantly generate a waveform preview.
          </p>
          <div className="mt-4 h-1 w-12 rounded bg-sable-heat" />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
          <p className="text-sm text-black/60 dark:text-sable-muted">Next</p>
          <p className="mt-2 text-lg font-medium">Library</p>
          <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
            Browse your drafts, search by tag, and stream instantly.
          </p>
          <div className="mt-4 h-1 w-12 rounded bg-sable-heat/60" />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
          <p className="text-sm text-black/60 dark:text-sable-muted">Later</p>
          <p className="mt-2 text-lg font-medium">Feedback</p>
          <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
            Share private links to get quick notes before release.
          </p>
          <div className="mt-4 h-1 w-12 rounded bg-sable-heat/30" />
        </div>
      </div>
    </div>
  );
}
