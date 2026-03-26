import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useState } from "react";

type LibraryItem = {
    title: string;
    meta: string;
};

const mockLibraryItems: LibraryItem[] = [
    { title: "Liked Songs", meta: "Playlist • 27 songs" },
    { title: "Velvet Horizon", meta: "Artist" },
    { title: "Neon Bloom", meta: "Playlist" },
    { title: "Solar Nights", meta: "Album" },
    { title: "Afterglow", meta: "Album" },
    { title: "Static Heart", meta: "Artist" },
];

export default function PlayerLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const isHome = location.pathname === "/home";
    const isLibrary = location.pathname === "/library";

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-[#050607] text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(249,115,22,0.22),transparent_20%),radial-gradient(circle_at_92%_24%,rgba(249,115,22,0.10),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.14))]" />

            <div className="relative z-10 grid h-full grid-rows-[auto_1fr_auto]">
                {/* TOP BAR */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">

                    {/* LEFT */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/home")}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08] text-xl text-white hover:bg-white/[0.14]"
                        >
                            ⌂
                        </button>
                    </div>

                    {/* CENTER (THIS IS THE FIX) */}
                    <div className="flex justify-center flex-1">
                        <div className="w-full max-w-[520px]">
                            <input
                                placeholder="What do you want to play?"
                                className="w-full rounded-full bg-white/[0.08] px-6 py-3 text-sm outline-none placeholder:text-white/40"
                            />
                        </div>
                    </div>

                    {/* RIGHT (placeholder for later) */}
                    <div className="w-[48px]" />
                </div>


                {/* MAIN APP AREA */}
                <div className="min-h-0 p-4 md:p-5 xl:p-6">
                    <div
                        className={`grid h-full min-h-0 gap-4 ${collapsed
                            ? "grid-cols-[92px_minmax(0,1fr)_300px]"
                            : "grid-cols-[300px_minmax(0,1fr)_320px]"
                            }`}
                    >
                        {/* LEFT PANEL */}
                        <aside className="min-h-0 overflow-y-auto rounded-[1.7rem] border border-white/10 bg-black/20 p-4 backdrop-blur-md xl:p-5">
                            <div className="flex items-center justify-between">
                                {!collapsed ? (
                                    <>
                                        <h2 className="text-[1.55rem] font-semibold tracking-tight">
                                            Your Library
                                        </h2>

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

                            <div className={`mt-6 ${collapsed ? "space-y-3" : "flex flex-wrap gap-3"}`}>
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

                                        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-white/80 transition hover:bg-white/[0.1]">

                                            ♥
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium">
                                            All
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
                                        <span>Recents</span>
                                        <span>☰</span>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {mockLibraryItems.map((item) => (
                                            <button
                                                key={item.title}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.05]"
                                            >
                                                <div className="h-12 w-12 shrink-0 rounded-lg bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.22),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.58))]" />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-white">
                                                        {item.title}
                                                    </p>
                                                    <p className="truncate text-xs text-white/45">
                                                        {item.meta}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </aside>

                        {/* CENTER PANEL */}
                        <main className="min-h-0 overflow-y-auto scroll-hidden ...">
                            <Outlet />
                        </main>

                        {/* RIGHT PANEL */}
                        <aside className="min-h-0 overflow-y-auto scroll-hidden ...">
                            <p className="text-sm text-white/45">Now Playing</p>

                            <div className="mt-4 aspect-square rounded-[1.25rem] bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.25),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.55))]" />

                            <div className="mt-5">
                                <p className="text-[1.8rem] font-semibold">Solar Fade</p>
                                <p className="mt-1 text-white/55">Aria Nova</p>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-white/45">
                                    Credits
                                </h3>
                                <div className="mt-4 space-y-3 text-sm text-white/68">
                                    <p>Produced by Night Engine</p>
                                    <p>Written by Aria Nova</p>
                                    <p>Mastered by Sunset Archive</p>
                                </div>
                            </div>

                            <div className="mt-8">
                                <h3 className="text-sm font-medium uppercase tracking-[0.16em] text-white/45">
                                    Next in queue
                                </h3>

                                <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                                    <div className="h-14 w-14 rounded-lg bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.22),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.58))]" />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white">
                                            Echo Bloom
                                        </p>
                                        <p className="text-xs text-white/45">Luma</p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>

                {/* BOTTOM PLAYER */}
                <div className="border-t border-white/8 bg-black/70 px-5 py-4 backdrop-blur-xl">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.25),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.55))]" />

                            <div>
                                <p className="font-medium text-white">Solar Fade</p>
                                <p className="text-sm text-white/50">Aria Nova</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-6 text-white/80">
                                <button>⏮</button>
                                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-black">
                                    ⏯
                                </button>
                                <button>⏭</button>
                            </div>

                            <div className="flex w-[320px] items-center gap-3 text-xs text-white/45">
                                <span>1:42</span>
                                <div className="h-1 flex-1 rounded-full bg-white/20">
                                    <div className="h-1 w-1/2 rounded-full bg-orange-300" />
                                </div>
                                <span>3:32</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-white/60">
                            <button>☷</button>
                            <button>⌕</button>
                            <button>🔊</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}