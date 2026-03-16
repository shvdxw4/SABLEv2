import { useEffect, useState } from "react";
import {
  fetchTracks,
  fetchTrackStreamUrl,
  type ListenerTrack,
} from "../api/tracks";

type LibraryState =
  | { status: "loading" }
  | { status: "error"; detail: string }
  | { status: "empty" }
  | { status: "ok"; items: ListenerTrack[] };

export default function Library() {
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  const [query, setQuery] = useState("");

  const [activeTrackTitle, setActiveTrackTitle] = useState<string>("");
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>("");
  const [streamLoadingId, setStreamLoadingId] = useState<number | null>(null);
  const [streamError, setStreamError] = useState<Record<number, string>>({});

  useEffect(() => {
    let alive = true;

    async function run() {
      setState({ status: "loading" });

      try {
        const items = await fetchTracks();
        if (!alive) return;

        if (!items || items.length === 0) {
          setState({ status: "empty" });
        } else {
          setState({ status: "ok", items });
        }
      } catch (e: any) {
        if (!alive) return;
        setState({
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

  async function handlePlay(track: ListenerTrack) {
    setStreamError((prev) => ({ ...prev, [track.id]: "" }));
    setStreamLoadingId(track.id);

    try {
      const url = await fetchTrackStreamUrl(track.id);
      setActiveTrackTitle(track.title);
      setActiveStreamUrl(url);
    } catch (e: any) {
      setStreamError((prev) => ({
        ...prev,
        [track.id]: e?.message ?? "Failed to load stream",
      }));
    } finally {
      setStreamLoadingId(null);
    }
  }

  const filteredItems =
    state.status === "ok"
      ? state.items.filter((item) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;

        const inTitle = item.title.toLowerCase().includes(q);
        const inTier = item.tier.toLowerCase().includes(q);

        return inTitle || inTier;
      })
      : [];

console.log("LIBRARY DEBUG", {
  state,
  filteredItems,
  query,
});

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
        <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
          Browse published tracks and stream them live from the platform.
        </p>
      </div>

      <div className="mt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title or tier…"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/30 dark:border-sable-border dark:bg-sable-bg dark:text-sable-text dark:focus:border-sable-muted"
        />
      </div>

      {activeStreamUrl && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
          <p className="text-sm text-black/60 dark:text-sable-muted">
            Now playing
          </p>
          <p className="mt-1 font-medium">{activeTrackTitle}</p>

          <audio
            key={activeStreamUrl}
            controls
            autoPlay
            className="mt-4 w-full"
            src={activeStreamUrl}
          />
        </div>
      )}

      <div className="mb-4 rounded-xl border border border-black/10 p-3 text-xs dark:border-sable-border">
        <div>status: {state.status}</div>
        <div>
          filtered count: {state.status === "ok" ? filteredItems.length : 0}
        </div>
      </div>

      {state.status === "loading" && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">Loading tracks…</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">
            <span className="font-medium text-red-600">Error</span> —{" "}
            {state.detail}
          </p>
          <p className="mt-2 text-black/60 dark:text-sable-muted">
            Check that the backend is online and that published tracks exist.
          </p>
        </div>
      )}

      {state.status === "empty" && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">
            No published tracks yet.
          </p>
        </div>
      )}

      {query.trim() && filteredItems.length === 0 && (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">
            No matches for “{query.trim()}”.
          </p>
        </div>
      )}

      {state.status === "ok" && filteredItems.length > 0 && (
        <div className="mt-6 grid gap-4">
          {filteredItems.map((track) => (
            <div
              key={track.id}
              className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-black/60 dark:text-sable-muted">
                    {track.published_at
                      ? new Date(track.published_at).toLocaleString()
                      : "Unpublished"}
                  </p>

                  <p className="mt-1 text-base font-medium">{track.title}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs text-black/70 dark:border-sable-border dark:bg-white/5 dark:text-sable-muted">
                      {track.tier}
                    </span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-2 md:w-56">
                  <button
                    type="button"
                    disabled={streamLoadingId === track.id}
                    onClick={() => handlePlay(track)}
                    className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sable-text dark:text-sable-bg"
                  >
                    {streamLoadingId === track.id ? "Loading…" : "Play"}
                  </button>

                  {streamError[track.id] && (
                    <p className="text-xs text-red-600">
                      {streamError[track.id]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}