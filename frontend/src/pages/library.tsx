import { memo, useEffect, useMemo, useState } from "react";
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

type SaveableTrack = {
  id: number;
  title: string;
  tier: string;
  artist?: string;
  artwork_url?: string | null;
};

type TrackCardProps = {
  track: ListenerTrack;
  isActive: boolean;
  isPlaying: boolean;
  saved: boolean;
  isLoading: boolean;
  error?: string;
  onPrimaryAction: (track: ListenerTrack) => void;
  onToggleSave: (track: SaveableTrack) => void;
};

const TrackCard = memo(function TrackCard({
  track,
  isActive,
  isPlaying,
  saved,
  isLoading,
  error,
  onPrimaryAction,
  onToggleSave,
}: TrackCardProps) {
  const showPause = isActive && isPlaying && !isLoading;

  return (
    <div className="group rounded-[1.15rem] border border-white/10 bg-black/20 p-3 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05]">
      <div className="relative aspect-square overflow-hidden rounded-[0.95rem]">
        {track.artwork_url ? (
          <img
            src={track.artwork_url}
            alt={track.title}
            className="block h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.24),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.58))]" />
        )}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-end gap-2 bg-black/20 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onPrimaryAction(track)}
            className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px] shadow-lg transition ${isActive
              ? "bg-white text-black"
              : "bg-white/90 text-black hover:scale-105"
              } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {isLoading ? "…" : showPause ? "⏸" : "▶"}
          </button>

          <button
            type="button"
            onClick={() =>
              onToggleSave({
                id: track.id,
                title: track.title,
                tier: track.tier,
                artist: "SABLE Sessions",
                artwork_url: track.artwork_url ?? null,
              })
            }
            className={`pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-[11px] shadow-lg transition ${saved
              ? "bg-orange-400/80 text-black"
              : "bg-white/80 text-black hover:scale-105"
              }`}
          >
            {saved ? "✓" : "+"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="truncate text-[1.05rem] font-medium text-white">
          {track.title}
        </p>
        <p className="mt-1 text-sm text-white/48">
          {track.published_at
            ? `Released ${new Date(track.published_at).toLocaleDateString()}`
            : "Unpublished"}
        </p>

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
});

function SectionRow({
  title,
  items,
  currentTrackId,
  isPlaying,
  isSaved,
  streamLoadingId,
  streamError,
  onPrimaryAction,
  onToggleSave,
}: {
  title: string;
  items: ListenerTrack[];
  currentTrackId?: number;
  isPlaying: boolean;
  isSaved: (id: number) => boolean;
  streamLoadingId: number | null;
  streamError: Record<number, string>;
  onPrimaryAction: (track: ListenerTrack) => void;
  onToggleSave: (track: SaveableTrack) => void;
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
          <TrackCard
            key={track.id}
            track={track}
            isActive={currentTrackId === track.id}
            isPlaying={isPlaying}
            saved={isSaved(track.id)}
            isLoading={streamLoadingId === track.id}
            error={streamError[track.id]}
            onPrimaryAction={onPrimaryAction}
            onToggleSave={onToggleSave}
          />
        ))}
      </div>
    </section>
  );
}

export default function Library() {
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  const [streamLoadingId, setStreamLoadingId] = useState<number | null>(null);
  const [streamError, setStreamError] = useState<Record<number, string>>({});

  const { query } = useSearch();
  const {
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
    setQueueFromTracks,
  } = usePlayer();
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

  const allItems = state.status === "ok" ? state.items : [];

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allItems.filter((item) => {
      if (!q) return true;
      return item.title.toLowerCase().includes(q);
    });
  }, [allItems, query]);

  const recentlyPublished = filteredItems.slice(0, 5);
  const newAndNotable = filteredItems.slice(5, 10);

  async function handlePlay(track: ListenerTrack) {
    setStreamError((prev) => ({ ...prev, [track.id]: "" }));
    setStreamLoadingId(track.id);

    try {
      const queueTracks = filteredItems.map((item) => ({
        id: item.id,
        title: item.title,
        tier: item.tier,
        artist: "SABLE Sessions",
        artwork_url: track.artwork_url,
      }));

      const startIndex = filteredItems.findIndex((item) => item.id === track.id);
      setQueueFromTracks(queueTracks, startIndex);

      const url = await fetchTrackStreamUrl(track.id);

      playTrack(
        {
          id: track.id,
          title: track.title,
          tier: track.tier,
          artist: "SABLE Sessions",
          artwork_url: track.artwork_url,
        },
        url
      );
    } catch (e: any) {
      setStreamError((prev) => ({
        ...prev,
        [track.id]: e?.message ?? "Failed to load stream",
      }));
    } finally {
      setStreamLoadingId(null);
    }
  }

  async function handlePrimaryAction(track: ListenerTrack) {
    if (currentTrack?.id === track.id) {
      await togglePlay();
      return;
    }

    await handlePlay(track);
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
          <SectionRow
            title="Recently published"
            items={recentlyPublished}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            isSaved={isSaved}
            streamLoadingId={streamLoadingId}
            streamError={streamError}
            onPrimaryAction={handlePrimaryAction}
            onToggleSave={toggleSavedTrack}
          />
          <SectionRow
            title="New & notable"
            items={newAndNotable}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            isSaved={isSaved}
            streamLoadingId={streamLoadingId}
            streamError={streamError}
            onPrimaryAction={handlePrimaryAction}
            onToggleSave={toggleSavedTrack}
          />
        </>
      )}
    </div>
  );
}