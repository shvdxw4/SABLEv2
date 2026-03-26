export default function Home() {
    const recentlyPlayed = [
        "Neon Nights",
        "Echo Drift",
        "Velvet Sky",
        "Lunar Tape",
        "Static Bloom",
    ];

    const recommendedPlaylists = [
        "Sunfall Mix",
        "Late Hour",
        "Deep Pulse",
        "Aurora Loop",
        "Midnight Run",
    ];

    const madeForYou = [
        "Afterglow Sessions",
        "Orange Hour",
        "Moonlit Signals",
        "Velvet Current",
        "Skyline Heat",
    ];

    function Card({
        title,
        subtitle,
    }: {
        title: string;
        subtitle: string;
    }) {
        return (
            <div className="group rounded-[1.15rem] border border-white/10 bg-black/20 p-3 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.05]">
                <div className="aspect-square rounded-[0.95rem] bg-[radial-gradient(circle_at_30%_20%,rgba(249,115,22,0.24),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.58))]" />

                <div className="mt-4">
                    <p className="truncate text-[1.05rem] font-medium text-white">
                        {title}
                    </p>

                    {subtitle && (
                        <p className="mt-1 text-sm text-white/48">{subtitle}</p>
                    )}
                </div>
            </div>
        );
    }

    function SectionRow({
        title,
        items,
        subtitle,
    }: {
        title: string;
        items: string[];
        subtitle?: string;
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
                    {items.map((item) => (
                        <Card key={item} title={item} subtitle="" />
                    ))}
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

            <SectionRow
                title="Recently played"
                subtitle="Jump back into your latest sessions."
                items={recentlyPlayed}
            />

            <SectionRow
                title="Recommended playlists"
                subtitle="Curated from your listening habits."
                items={recommendedPlaylists}
            />

            <SectionRow
                title="Made for you"
                subtitle="More of the sound and mood you keep returning to."
                items={madeForYou}
            />
        </div>
    );
}