import { memo, useMemo, useState } from "react";
import { usePlayer } from "../player/PlayerContext";
import { useLibrary, type SavedTrack } from "../library/LibraryContext";
import { useSearch } from "../search/SearchContext";
import { fetchTrackStreamUrl } from "../api/tracks";

type TrackCardProps = {
  track: SavedTrack;
  isActive: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  error?: string;
  onPrimaryAction: (track: SavedTrack) => void;
  onToggleSave: (track: SavedTrack) => void;
};

const TrackCard = memo(function TrackCard({
  track,
  isActive,
  isPlaying,
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
            onClick={() => onToggleSave(track)}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-orange-400/80 text-[11px] text-black shadow-lg transition hover:scale-105"
          >
            ✓
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="truncate text-[1.05rem] font-medium text-white">
          {track.title}
        </p>
        <p className="mt-1 text-sm text-white/48">
          {track.artist || "SABLE Sessions"}
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
  streamLoadingId,
  streamError,
  onPrimaryAction,
  onToggleSave,
}: {
  title: string;
  items: SavedTrack[];
  currentTrackId?: number;
  isPlaying: boolean;
  streamLoadingId: number | null;
  streamError: Record<number, string>;
  onPrimaryAction: (track: SavedTrack) => void;
  onToggleSave: (track: SavedTrack) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[1.8rem] font-semibold tracking-tight text-white">
          {title}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        {items.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            isActive={currentTrackId === track.id}
            isPlaying={isPlaying}
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
  const { savedTracks, toggleSavedTrack } = useLibrary();

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    return savedTracks.filter((item) => {
      if (!q) return true;

      return (
        item.title.toLowerCase().includes(q) ||
        (item.artist || "").toLowerCase().includes(q)
      );
    });
  }, [savedTracks, query]);

  async function handlePlay(track: SavedTrack) {
    setStreamError((prev) => ({ ...prev, [track.id]: "" }));
    setStreamLoadingId(track.id);

    try {
      const queueTracks = filteredItems.map((item) => ({
        id: item.id,
        title: item.title,
        tier: item.tier,
        artist: item.artist || "SABLE Sessions",
        artwork_url: item.artwork_url,
      }));

      const startIndex = filteredItems.findIndex((item) => item.id === track.id);
      setQueueFromTracks(queueTracks, startIndex);

      const url = await fetchTrackStreamUrl(track.id);

      playTrack(
        {
          id: track.id,
          title: track.title,
          tier: track.tier,
          artist: track.artist || "SABLE Sessions",
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

  async function handlePrimaryAction(track: SavedTrack) {
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
            Your saved tracks, ready to revisit anytime.
          </p>
        </div>
      </div>

      {savedTracks.length === 0 && !query.trim() && (
        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-white/70">
          Your library is empty. Add tracks from Home to build it out.
        </div>
      )}

      {query.trim() && filteredItems.length === 0 && (
        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-white/70">
          No saved tracks match “{query.trim()}”.
        </div>
      )}

      {filteredItems.length > 0 && (
        <SectionRow
          title="Recently Added"
          items={filteredItems}
          currentTrackId={currentTrack?.id}
          isPlaying={isPlaying}
          streamLoadingId={streamLoadingId}
          streamError={streamError}
          onPrimaryAction={handlePrimaryAction}
          onToggleSave={toggleSavedTrack}
        />
      )}
    </div>
  );
}