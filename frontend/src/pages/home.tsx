import { useEffect, useMemo, useState } from "react";
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

export default function Home() {
    const { recentTracks, playTrack, currentTrack, setQueueFromTracks } = usePlayer();
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

    async function handlePlay(track: ListenerTrack) {
        setStreamError((prev) => ({ ...prev, [track.id]: "" }));
        setStreamLoadingId(track.id);

        try {
            const queueTracks = allItems.map((item) => ({
                id: item.id,
                title: item.title,
                tier: item.tier,
                artist: "SABLE Sessions",
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

    const allItems =
        state.status === "ok"
            ? state.items.filter((item) => {
                const q = query.trim().toLowerCase();
                if (!q) return true;

                return (
                    item.title.toLowerCase().includes(q) ||
                    item.tier.toLowerCase().includes(q)
                );
            })
            : [];

    const recentlyPlayed = useMemo(() => recentTracks.slice(0, 5), [recentTracks]);
    const recentlyPublished = useMemo(() => allItems.slice(0, 5), [allItems]);
    const recommended = useMemo(() => allItems.slice(5, 10), [allItems]);

    function RealTrackCard({ track }: { track: ListenerTrack }) {
        const isActive = currentTrack?.id === track.id;
        const isSubscriber = track.tier === "SUBSCRIBER";
        const saved = isSaved(track.id);

        return (
            <div className="group relative rounded-[1.15rem] border border-white/10 bg-black/20 p-3 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05]">
                <div className="relative aspect-square overflow-hidden rounded-[0.95rem]">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.24),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.58))]" />

                    <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/20 backdrop-blur-sm opacity-0 transition group-hover:opacity-100">
                        <button
                            type="button"
                            disabled={streamLoadingId === track.id}
                            onClick={() => handlePlay(track)}
                            className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition ${isActive
                                ? "bg-white text-black"
                                : "bg-white/90 text-black hover:scale-105"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            {streamLoadingId === track.id ? "…" : "▶"}
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
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition ${saved
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

                    {streamError[track.id] && (
                        <p className="mt-2 text-xs text-red-400">{streamError[track.id]}</p>
                    )}
                </div>
            </div>
        );
    }

    function RecentCard({
        track,
    }: {
        track: {
            id: number;
            title: string;
            tier: string;
            artist?: string;
            streamUrl?: string;
        };
    }) {
        const isActive = currentTrack?.id === track.id;
        const saved = isSaved(track.id);

        return (
            <div className="group relative rounded-[1.15rem] border border-white/10 bg-black/20 p-3 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05]">
                <div className="relative aspect-square overflow-hidden rounded-[0.95rem]">
                    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.24),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.58))]" />

                    <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/40 opacity-0 transition group-hover:opacity-100">
                        <button
                            type="button"
                            disabled={!track.streamUrl}
                            onClick={() => {
                                if (!track.streamUrl) return;
                                playTrack(
                                    {
                                        id: track.id,
                                        title: track.title,
                                        tier: track.tier,
                                        artist: track.artist || "SABLE Sessions",
                                    },
                                    track.streamUrl
                                );
                            }}
                            className={`flex h-12 w-12 items-center justify-center rounded-full text-lg transition ${isActive
                                ? "bg-white text-black"
                                : "bg-white/90 text-black hover:scale-105"
                                } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                            ▶
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                toggleSavedTrack({
                                    id: track.id,
                                    title: track.title,
                                    tier: track.tier,
                                    artist: track.artist || "SABLE Sessions",
                                })
                            }
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm transition ${saved
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
                </div>
            </div>
        );
    }

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
                            <RealTrackCard key={track.id} track={track} />
                        ))}
                    </SectionRow>

                    <SectionRow
                        title="Recommended for you"
                        subtitle="A rotating selection from the live catalog."
                    >
                        {recommended.length > 0 ? (
                            recommended.map((track) => (
                                <RealTrackCard key={track.id} track={track} />
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
