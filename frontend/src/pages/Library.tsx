import { useEffect, useState } from "react";
import { fetchAudioList, type AudioFile } from "../api/audio";
import { API_BASE_URL } from "../config";

type LibraryState =
  | { status: "loading" }
  | { status: "error"; detail: string }
  | { status: "empty" }
  | { status: "ok"; items: AudioFile[] };

export default function Library() {
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  const [waveOk, setWaveOk] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;

    async function run() {
      setState({ status: "loading" });
      try {
        const items = await fetchAudioList();
        if (!alive) return;

        if (!items || items.length === 0) {
          setState({ status: "empty" });
        } else {
          setState({ status: "ok", items });
        }
      } catch (e: any) {
        if (!alive) return;
        setState({ status: "error", detail: e?.message ?? "Unknown error" });
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
        <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
          Your uploaded drafts, pulled live from the backend.
        </p>
      </div>

      {state.status === "loading" && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">Loading audio…</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">
            <span className="font-medium text-red-600">Error</span> — {state.detail}
          </p>
          <p className="mt-2 text-black/60 dark:text-sable-muted">
            Check that the backend is online and CORS allows localhost.
          </p>
        </div>
      )}

      {state.status === "empty" && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">
            No audio yet. Upload a track to see it here.
          </p>
        </div>
      )}

      {state.status === "ok" && (
        <div className="grid gap-4">
          {state.items.map((item) => {
            const waveformUrl = `${API_BASE_URL}/audio/${encodeURIComponent(
              item.filename
            )}/waveform`;

            const streamUrl = `${API_BASE_URL}/audio/${encodeURIComponent(
              item.filename
            )}/stream`;

            return (
              <div
                key={item.filename}
                className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-black/60 dark:text-sable-muted">
                      {item.last_modified}
                    </p>
                    <p className="mt-1 text-base font-medium">{item.filename}</p>
                    <p className="mt-1 text-sm text-black/70 dark:text-sable-muted">
                      Duration:{" "}
                      {item.duration_sec !== null ? `${item.duration_sec}s` : "—"}
                    </p>
                  </div>

                  <audio controls className="w-full md:w-80">
                    <source src={streamUrl} />
                  </audio>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-black/10 dark:border-sable-border">
                  {waveOk[item.filename] === false ? (
                    <div className="flex h-20 items-center justify-center bg-black/5 text-xs text-black/60 dark:bg-white/5 dark:text-sable-muted">
                      Waveform unavailable (demo tier)
                    </div>
                  ) : (
                    <img
                      src={waveformUrl}
                      alt="waveform"
                      className="h-20 w-full object-cover"
                      onError={() => setWaveOk((m) => ({ ...m, [item.filename]: false }))}
                      onLoad={() => setWaveOk((m) => ({ ...m, [item.filename]: true }))}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
