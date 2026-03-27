import { useEffect, useMemo, useState } from "react";
import { usePlayer } from "../player/PlayerContext";
import { useLibrary } from "../library/LibraryContext";
import { useSearch } from "../search/SearchContext";
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
  const [streamLoadingId, setStreamLoadingId] = useState<number | null>(null);
  const [streamError, setStreamError] = useState<Record<number, string>>({});

  const { query } = useSearch();
  const { playTrack, currentTrack } = usePlayer();
  const { isSaved, toggleSavedTrack } = useLibrary();

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
      playTrack(
        {
          id: track.id,
          title: track.title,
          tier: track.tier,
          artist: "SABLE Sessions",
        }, url);
    } catch (e: any) {
      setStreamError((prev) => ({
        ...prev,
        [track.id]: e?.message ?? "Failed to load stream",
      }))
    } finally {
      setStreamLoadingId(null);
    }
  }

  const allItems = state.status === "ok" ? state.items : [];

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allItems.filter((item) => {
      if (!q) return true;

      return (
        item.title.toLowerCase().includes(q) ||
        item.tier.toLowerCase().includes(q)
      );
    });
  }, [allItems, query]);

  const recentlyPublished = filteredItems.slice(0, 5);
  const newAndNotable = filteredItems.slice(5, 10);

  function TrackCard({ track }: { track: ListenerTrack }) {
    const isActive = currentTrack?.id === track.id;
    const isSubscriber = track.tier === "SUBSCRIBER";
    const saved = isSaved(track.id);

    return (
      <div className="group rounded-[1.15rem] border border-white/10 bg-black/20 p-3 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05]">
        <div className="aspect-square rounded-[0.95rem] bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.24),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.58))]" />

        <div className="mt-4">
          <p className="truncate text-[1.05rem] font-medium text-white">
            {track.title}
          </p>
          <p className="mt-1 text-sm text-white/48">
            {track.published_at
              ? `Released ${new Date(track.published_at).toLocaleDateString()}`
              : "Unpublished"}
          </p>

          <div className="mt-3">
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${isSubscriber
                ? "bg-orange-400/15 text-orange-300"
                : "bg-white/10 text-white/70"
                }`}
            >
              {track.tier}
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2"></div>
          <button
            type="button"
            disabled={streamLoadingId === track.id}
            onClick={() => handlePlay(track)}
            className={`flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition ${isActive
              ? "bg-white text-black"
              : "border border-white/10 bg-white/[0.03] text-white hover:border-white/20 hover:bg-white/[0.08]"
              } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {streamLoadingId === track.id ? "Loading…" : "Play"}
          </button>

          <button
            type="button"
            onClick={() =>
              toggleSavedTrack({
                id: track.id,
                title: track.title,
                tier: track.tier,
                artist: "SABLE Sessions",
              })
            }
            className={`flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition ${saved
              ? "bg-white text-black"
              : "border border-white/10 bg-white/[0.03] text-white hover:border-white/20 hover:bg-white/[0.08]"
              }`}
          >
            {saved ? "Added" : "Add"}
          </button>

          {streamError[track.id] && (
            <p className="mt-2 text-xs text-red-400">{streamError[track.id]}</p>
          )}
        </div>
      </div>
    );
  }

  function SectionRow({
    title,
    items,
  }: {
    title: string;
    items: ListenerTrack[];
  }) {
    if (items.length === 0) return null;

    return (
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[1.8rem] font-semibold tracking-tight text-white">
            {title}
          </h2>

          <button
            type="button"
            className="text-sm text-white/50 transition hover:text-white/80"
          >
            View all
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {items.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[3rem] font-semibold tracking-tight text-white">
            Library
          </h1>
          <p className="mt-2 text-base text-white/55">
            Browse published tracks and stream them live from the platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white">
            + Create
          </button>
          <button className="text-sm text-white/55 transition hover:text-white/80">
            Recents
          </button>
        </div>
      </div>

      {state.status === "loading" && (
        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-white/70">
          Loading tracks…
        </div>
      )}

      {state.status === "error" && (
        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
          <p className="text-white/80">
            <span className="text-red-400">Error</span> — {state.detail}
          </p>
        </div>
      )}

      {state.status === "empty" && (
        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-white/70">
          No tracks are available yet.
        </div>
      )}

      {query.trim() && filteredItems.length === 0 && (
        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-white/70">
          No matches for “{query.trim()}”.
        </div>
      )}

      {state.status === "ok" && filteredItems.length > 0 && (
        <>
          <SectionRow title="Recently published" items={recentlyPublished} />
          <SectionRow title="New & notable" items={newAndNotable} />
        </>
      )}
    </div>
  );
}