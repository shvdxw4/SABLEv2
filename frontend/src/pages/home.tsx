import { memo, useEffect, useMemo, useState } from "react";
import { usePlayer } from "../player/PlayerContext";
import { useLibrary } from "../library/LibraryContext";
import { useSearch } from "../search/SearchContext";
import {
    fetchTracks,
    fetchTrackStreamUrl,
    type ListenerTrack,
} from "../api/tracks";

type HomeState =
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

type RecentTrackCardData = {
    id: number;
    title: string;
    tier: string;
    artist?: string;
    streamUrl?: string;
    artwork_url?: string | null;
};

type RealTrackCardProps = {
    track: ListenerTrack;
    isActive: boolean;
    isPlaying: boolean;
    saved: boolean;
    isLoading: boolean;
    error?: string;
    onPrimaryAction: (track: ListenerTrack) => void;
    onToggleSave: (track: SaveableTrack) => void;
};

const RealTrackCard = memo(function RealTrackCard({
    track,
    isActive,
    isPlaying,
    saved,
    isLoading,
    error,
    onPrimaryAction,
    onToggleSave,
}: RealTrackCardProps) {
    const showPause = isActive && isPlaying && !isLoading;

    return (
        <div className="group rounded-[1.15rem] border border-white/10 bg-black/20 p-3 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05]">
            <div className="relative aspect-square overflow-hidden rounded-[0.95rem]">
                {track.artwork_url ? (
                    <img
                        src={track.artwork_url}
                        alt={track.title}
                        className="h-full w-full object-cover"
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
                                artwork_url: track.artwork_url,
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

type RecentCardProps = {
    track: RecentTrackCardData;
    isActive: boolean;
    isPlaying: boolean;
    saved: boolean;
    isLoading: boolean;
    error?: string;
    onPrimaryAction: (track: RecentTrackCardData) => void;
    onToggleSave: (track: SaveableTrack) => void;
};

const RecentCard = memo(function RecentCard({
    track,
    isActive,
    isPlaying,
    saved,
    isLoading,
    error,
    onPrimaryAction,
    onToggleSave,
}: RecentCardProps) {
    const showPause = isActive && isPlaying && !isLoading;

    return (
        <div className="group rounded-[1.15rem] border border-white/10 bg-black/20 p-3 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05]">
            <div className="relative aspect-square overflow-hidden rounded-[0.95rem]">
                {track.artwork_url ? (
                    <img
                        src={track.artwork_url}
                        alt={track.title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.24),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.58))]" />
                )}

                <div className="pointer-events-none absolute inset-0 flex items-end justify-end gap-2 bg-black/20 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => onPrimaryAction(track)}
                        className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition ${isActive
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
                                artist: track.artist || "SABLE Sessions",
                                artwork_url: track.artwork_url,
                            })
                        }
                        className={`pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full text-xs transition ${saved
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
                {track.artist && (
                    <p className="mt-1 text-sm text-white/48">{track.artist}</p>
                )}

                {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>
        </div>
    );

});

function SectionRow({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-[1.8rem] font-semibold tracking-tight text-white">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-1 text-sm text-white/45">{subtitle}</p>
                    )}
                </div>

                <button
                    type="button"
                    className="text-sm text-white/50 transition hover:text-white/80"
                >
                    Show all
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 2xl:grid-cols-5">
                {children}
            </div>
        </section>
    );
}

export default function Home() {
    const {
        recentTracks,
        playTrack,
        currentTrack,
        isPlaying,
        togglePlay,
        setQueueFromTracks,
    } = usePlayer();
    const { isSaved, toggleSavedTrack } = useLibrary();
    const { query } = useSearch();

    const [state, setState] = useState<HomeState>({ status: "loading" });
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

    const allItems =
        state.status === "ok"
            ? state.items.filter((item) => {
                const q = query.trim().toLowerCase();
                if (!q) return true;

                return item.title.toLowerCase().includes(q);
            })
            : [];

    const recentlyPlayed = useMemo(() => recentTracks.slice(0, 5), [recentTracks]);
    const recentlyPublished = useMemo(() => allItems.slice(0, 5), [allItems]);
    const recommended = useMemo(() => allItems.slice(5, 10), [allItems]);

    async function handlePlay(track: ListenerTrack) {
        setStreamError((prev) => ({ ...prev, [track.id]: "" }));
        setStreamLoadingId(track.id);

        try {
            const queueTracks = allItems.map((item) => ({
                id: item.id,
                title: item.title,
                tier: item.tier,
                artist: "SABLE Sessions",
                artwork_url: item.artwork_url,
            }));

            const startIndex = allItems.findIndex((item) => item.id === track.id);
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

    async function handleRecentPlay(track: RecentTrackCardData) {
        setStreamError((prev) => ({ ...prev, [track.id]: "" }));
        setStreamLoadingId(track.id);

        try {
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

    async function handlePrimaryAction(track: ListenerTrack) {
        if (currentTrack?.id === track.id) {
            await togglePlay();
            return;
        }

        await handlePlay(track);
    }

    async function handleRecentPrimaryAction(track: RecentTrackCardData) {
        if (currentTrack?.id === track.id) {
            await togglePlay();
            return;
        }

        await handleRecentPlay(track);

    }

    return (
        <div>
            <div>
                <h1 className="text-[3rem] font-semibold tracking-tight text-white">
                    Welcome back
                </h1>
                <p className="mt-2 text-base text-white/55">
                    Pick up where you left off and move through music tailored to you.
                </p>
            </div>

            {state.status === "loading" && (
                <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-white/70">
                    Loading home feed…
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

            <SectionRow
                title="Recently played"
                subtitle="Jump back into your latest sessions."
            >
                {recentlyPlayed.length > 0 ? (
                    recentlyPlayed.map((track) => (
                        <RecentCard
                            key={track.id}
                            track={track}
                            isActive={currentTrack?.id === track.id}
                            isPlaying={isPlaying}
                            saved={isSaved(track.id)}
                            isLoading={streamLoadingId === track.id}
                            error={streamError[track.id]}
                            onPrimaryAction={handleRecentPrimaryAction}
                            onToggleSave={toggleSavedTrack}
                        />
                    ))
                ) : (
                    <div className="col-span-full rounded-[1.15rem] border border-white/10 bg-black/20 p-6 text-white/45">
                        Start playing tracks from the library to build your history.
                    </div>
                )}
            </SectionRow>

            {state.status === "ok" && (
                <>
                    <SectionRow
                        title="Recently published"
                        subtitle="Fresh drops available in your listening space."
                    >
                        {recentlyPublished.map((track) => (
                            <RealTrackCard
                                key={track.id}
                                track={track}
                                isActive={currentTrack?.id === track.id}
                                isPlaying={isPlaying}
                                saved={isSaved(track.id)}
                                isLoading={streamLoadingId === track.id}
                                error={streamError[track.id]}
                                onPrimaryAction={handlePrimaryAction}
                                onToggleSave={toggleSavedTrack}
                            />
                        ))}
                    </SectionRow>

                    <SectionRow
                        title="Recommended for you"
                        subtitle="A rotating selection from the live catalog."
                    >
                        {recommended.length > 0 ? (
                            recommended.map((track) => (
                                <RealTrackCard
                                    key={track.id}
                                    track={track}
                                    isActive={currentTrack?.id === track.id}
                                    isPlaying={isPlaying}
                                    saved={isSaved(track.id)}
                                    isLoading={streamLoadingId === track.id}
                                    error={streamError[track.id]}
                                    onPrimaryAction={handlePrimaryAction}
                                    onToggleSave={toggleSavedTrack}
                                />
                            ))
                        ) : (
                            <div className="col-span-full rounded-[1.15rem] border border-white/10 bg-black/20 p-6 text-white/45">
                                Add more published tracks to expand recommendations.
                            </div>
                        )}
                    </SectionRow>
                </>
            )}
        </div>
    );
}