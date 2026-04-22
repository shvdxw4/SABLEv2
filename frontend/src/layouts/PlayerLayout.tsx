import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../player/PlayerContext";
import { useLibrary } from "../library/LibraryContext";
import { fetchTrackStreamUrl } from "../api/tracks";
import { useSearch } from "../search/SearchContext";
import { useAuth } from "../auth/AuthContext";

export default function PlayerLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const accountMenuRef = useRef<HTMLDivElement | null>(null);

    const {
        currentTrack,
        isPlaying,
        togglePlay,
        audioRef,
        setIsPlaying,
        playTrack,
        playNext,
        playPrevious,
        currentTime,
        duration,
        setDurationFromAudio,
        setCurrentTimeFromAudio,
        seekTo,
        handleEnded,
        queue,
        currentIndex,
        resetPlayer,
    } = usePlayer();

    const { savedTracks } = useLibrary();
    const { query, setQuery } = useSearch();
    const { user, logout } = useAuth();

    const isHome = location.pathname === "/home";
    const isLibrary = location.pathname === "/library";

    const nextQueueTrack =
        queue.length > 0 && currentIndex + 1 < queue.length
            ? queue[currentIndex + 1]
            : null;

    async function handlePlaySavedTrack(track: {
        id: number;
        title: string;
        tier: string;
        artist?: string;
        artwork_url?: string | null;
    }) {
        try {
            const url = await fetchTrackStreamUrl(track.id);

            playTrack(
                {
                    id: track.id,
                    title: track.title,
                    tier: track.tier,
                    artist: track.artist,
                    artwork_url: track.artwork_url,
                },
                url
            );
        } catch (error) {
            console.error("Failed to play saved track:", error);
        }
    }

    function formatTime(time: number) {
        if (!Number.isFinite(time) || time < 0) return "0:00";

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);

        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    const progressPercent =
        duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                accountMenuRef.current &&
                !accountMenuRef.current.contains(event.target as Node)
            ) {
                setAccountOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    function handleLogout() {
        setAccountOpen(false);
        resetPlayer();
        logout();
        navigate("/");
    }

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-[#050607] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(249,115,22,0.22),transparent_20%),radial-gradient(circle_at_92%_24%,rgba(249,115,22,0.10),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.14))]" />

            <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto]">
                <div className="border-b border-white/8 px-4 py-4 md:px-5 xl:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate("/home")}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xl font-semibold text-white transition hover:bg-white/[0.14]"
                            >
                                ⌂
                            </button>
                        </div>

                        <div className="flex flex-1 justify-center">
                            <div className="w-full max-w-[520px]">
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="What do you want to play?"
                                    className="w-full rounded-full bg-white/[0.08] px-6 py-3 text-sm outline-none placeholder:text-white/40"
                                />
                            </div>
                        </div>

                        <div className="relative z-50" ref={accountMenuRef}>
                            <button
                                type="button"
                                onClick={() => setAccountOpen((prev) => !prev)}
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-sm font-medium text-white transition hover:bg-white/[0.14]"
                            >
                                {user?.username?.slice(0, 1).toUpperCase() || "U"}
                            </button>

                            {accountOpen && (
                                <div className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#111315] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                                    <div className="border-b border-white/8 px-4 py-3">
                                        <p className="text-sm font-medium text-white">
                                            {user?.username || "User"}
                                        </p>
                                        <p className="mt-1 text-xs text-white/45">
                                            {user?.email || "Signed in"}
                                        </p>
                                    </div>

                                    <div className="p-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigate("/home");
                                                setAccountOpen(false);
                                            }}
                                            className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                                        >
                                            Home
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigate("/library");
                                                setAccountOpen(false);
                                            }}
                                            className="mt-1 flex w-full rounded-xl px-3 py-2 text-left text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                                        >
                                            Library
                                        </button>

                                        <div className="mt-1 rounded-xl px-3 py-2 text-left text-sm text-white/35">
                                            Account settings — soon
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigate("/manage-plan");
                                                setAccountOpen(false);
                                            }}
                                            className="mt-1 flex w-full rounded-xl px-3 py-2 text-left text-sm text-white/75 transition hover:bg-white/[0.06] hover:text-white">
                                            Manage Plan
                                        </button>

                                        <div className="my-2 border-t border-white/8" />

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex w-full rounded-xl px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-400/10 hover:text-red-200"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="min-h-0 p-4 md:p-5 xl:p-6">
                    <div
                        className={`grid h-full min-h-0 gap-4 ${collapsed
                            ? "grid-cols-[92px_minmax(0,1fr)_300px]"
                            : "grid-cols-[300px_minmax(0,1fr)_320px]"
                            }`}
                    >
                        <aside className="min-h-0 overflow-y-auto scroll-hidden rounded-[1.7rem] border border-white/10 bg-black/20 p-4 backdrop-blur-md xl:p-5">
                            <div className="flex items-center justify-between">
                                {!collapsed ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => navigate("/library")}
                                            className="text-left text-[1.55rem] font-semibold tracking-tight transition hover:text-white/80"
                                        >
                                            Library
                                        </button>

                                        <button
                                            onClick={() => setCollapsed(true)}
                                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                                        >
                                            Collapse
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex w-full justify-center">
                                        <button
                                            onClick={() => setCollapsed(false)}
                                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                                        >
                                            Expand
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div
                                className={`mt-6 ${collapsed ? "space-y-3" : "flex flex-wrap gap-3"
                                    }`}
                            >
                                {collapsed ? (
                                    <>
                                        <button
                                            onClick={() => navigate("/home")}
                                            className={`flex h-11 w-11 items-center justify-center rounded-full transition ${isHome
                                                ? "bg-white text-black"
                                                : "bg-white/[0.06] text-white/80 hover:bg-white/[0.1]"
                                                }`}
                                        >
                                            ⌂
                                        </button>

                                        <button
                                            onClick={() => navigate("/library")}
                                            className={`flex h-11 w-11 items-center justify-center rounded-full transition ${isLibrary
                                                ? "bg-white text-black"
                                                : "bg-white/[0.06] text-white/80 hover:bg-white/[0.1]"
                                                }`}
                                        >
                                            ☰
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black">
                                            Playlists
                                        </button>
                                        <button className="rounded-full bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/75">
                                            Artists
                                        </button>
                                        <button className="rounded-full bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/75">
                                            Albums
                                        </button>
                                    </>
                                )}
                            </div>

                            {!collapsed && (
                                <>
                                    <div className="mt-6 flex items-center justify-between text-sm text-white/45">
                                        <span>Saved Tracks</span>
                                        <span>{savedTracks.length}</span>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {savedTracks.length > 0 ? (
                                            savedTracks.map((item) => {
                                                const isActive = currentTrack?.id === item.id;

                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handlePlaySavedTrack(item)}
                                                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${isActive
                                                            ? "bg-white/[0.10] ring-1 ring-white/15"
                                                            : "hover:bg-white/[0.05]"
                                                            }`}
                                                    >
                                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                                                            {item.artwork_url ? (
                                                                <img
                                                                    src={item.artwork_url}
                                                                    alt={item.title}
                                                                    className="block h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.22),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.58))]" />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-white">
                                                                {item.title}
                                                            </p>
                                                            <p className="truncate text-xs text-white/45">
                                                                {item.artist || "SABLE"}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/45">
                                                Saved tracks will appear here.
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </aside>

                        <main className="min-h-0 overflow-y-auto scroll-hidden rounded-[1.7rem] border border-white/10 bg-black/20 p-6 backdrop-blur-md xl:p-8">
                            <Outlet />
                        </main>

                        <aside className="min-h-0 overflow-y-auto scroll-hidden rounded-[1.7rem] border border-white/10 bg-black/20 p-6 backdrop-blur-md xl:p-8">
                            <p className="text-sm text-white/45">Now Playing</p>

                            <div className="mt-4 aspect-square rounded-[1.25rem]">
                                {currentTrack?.artwork_url ? (
                                    <img
                                        src={currentTrack.artwork_url}
                                        alt={currentTrack.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.25),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.55))]" />
                                )}
                            </div>

                            <div className="mt-5">
                                <p className="text-[1.8rem] font-semibold">
                                    {currentTrack?.title || "Nothing Playing"}
                                </p>
                                <p className="mt-1 text-white/55">
                                    {currentTrack?.artist || "SABLE"}
                                </p>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-white/45">
                                    Credits
                                </h3>

                                {currentTrack ? (
                                    <div className="mt-4 space-y-3 text-sm text-white/68">
                                        <p>Written by {currentTrack.artist || "SABLE Sessions"}</p>
                                        <p>Produced by SABLE Sessions</p>
                                        <p>Mastered by SABLE</p>
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-white/45">
                                        Play a track to view credits.
                                    </p>
                                )}
                            </div>

                            <div className="mt-8">
                                <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-white/45">
                                    Next in queue
                                </h3>

                                {nextQueueTrack ? (
                                    <button
                                        type="button"
                                        onClick={() => playNext()}
                                        className="mt-4 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]"
                                    >
                                        <div className="h-14 w-14 overflow-hidden rounded-lg">
                                            {nextQueueTrack?.artwork_url ? (
                                                <img
                                                    src={nextQueueTrack.artwork_url}
                                                    alt={nextQueueTrack.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.22),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.58))]" />
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white">
                                                {nextQueueTrack.title}
                                            </p>
                                            <p className="text-xs text-white/45">
                                                {nextQueueTrack.artist || "SABLE"}
                                            </p>
                                        </div>
                                    </button>
                                ) : (
                                    <p className="mt-4 text-sm text-white/45">Queue is empty.</p>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>

                <div className="border-t border-white/8 bg-black/70 px-5 py-4 backdrop-blur-xl">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl">
                                {currentTrack?.artwork_url ? (
                                    <img
                                        src={currentTrack.artwork_url}
                                        alt={currentTrack.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.25),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.55))]" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-white">
                                    {currentTrack?.title || "Nothing Playing"}
                                </p>
                                <p className="text-sm text-white/50">
                                    {currentTrack?.artist || "SABLE"}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={playPrevious}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                                >
                                    ⏮
                                </button>

                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg text-black transition hover:scale-[1.02]"
                                >
                                    {isPlaying ? "⏸" : "▶"}
                                </button>

                                <button
                                    type="button"
                                    onClick={playNext}
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                                >
                                    ⏭
                                </button>
                            </div>

                            <div className="flex w-[320px] items-center gap-3 text-xs text-white/45">
                                <span>{formatTime(currentTime)}</span>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const clickX = e.clientX - rect.left;
                                        const ratio = rect.width > 0 ? clickX / rect.width : 0;
                                        seekTo(ratio * duration);
                                    }}
                                    className="h-2 flex-1 rounded-full bg-white/20"
                                >
                                    <div
                                        className="h-2 rounded-full bg-orange-300"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </button>

                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                            >
                                ☷
                            </button>
                            <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                            >
                                ⌕
                            </button>
                            <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                            >
                                🔊
                            </button>
                        </div>
                    </div>

                    {currentTrack?.streamUrl && (
                        <audio
                            ref={audioRef}
                            key={currentTrack.streamUrl}
                            src={currentTrack.streamUrl}
                            autoPlay
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onLoadedMetadata={setDurationFromAudio}
                            onTimeUpdate={setCurrentTimeFromAudio}
                            onEnded={handleEnded}
                            className="hidden"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}