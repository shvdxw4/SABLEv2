import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import heroImage from "../assets/hero.png";

type FeatureCard = {
  eyebrow: string;
  title: string;
  body: string;
};

const featureCards: FeatureCard[] = [
  {
    eyebrow: "Creator flow",
    title: "Draft to Publish",
    body: "Upload audio and artwork, save privately, and only release when the track is ready.",
  },
  {
    eyebrow: "Listener flow",
    title: "Library Streaming",
    body: "Browse published tracks, move through highlights, and keep your listening in one place.",
  },
  {
    eyebrow: "Separate systems",
    title: "Distinct Experiences",
    body: "Consumers and artists move through different worlds while sharing the same platform engine.",
  },
];

const logos = [
  "Sound & Color",
  "INDIE SHIP",
  "Aurora FM",
  "creator circle",
  "Vault Sessions",
];

export default function Landing() {
  const { user } = useAuth();
  const isLoggedIn = Boolean(user);

  return (
    <div className="min-h-screen bg-[#050607] text-white">
      <section className="relative min-h-screen overflow-hidden bg-[#07090b]">
        <div
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "80%",
            backgroundPosition: "100% 20%",
            backgroundRepeat: "no-repeat",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(249,115,22,0.22),transparent_18%),linear-gradient(90deg,rgba(5,7,9,0.96)_0%,rgba(5,7,9,0.88)_28%,rgba(5,7,9,0.54)_52%,rgba(5,7,9,0.18)_72%,rgba(5,7,9,0.08)_100%)]" />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,9,0.16)_0%,rgba(5,7,9,0.34)_62%,rgba(5,7,9,0.78)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1500px] flex-col px-8 pt-8 md:px-10 lg:px-12">
          <header className="flex items-center justify-between">
            <div className="text-[2rem] font-semibold tracking-[0.12em] text-white">
              SABLE
            </div>

            <nav className="hidden items-center gap-10 text-sm text-white/78 lg:flex">
              <span className="cursor-default transition hover:text-white">
                Features
              </span>
              <span className="cursor-default transition hover:text-white">
                Pricing
              </span>

              {!isLoggedIn ? (
                <>
                  <Link to="/login" className="transition hover:text-white">
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-full bg-white px-5 py-3 font-medium text-black transition hover:opacity-90"
                  >
                    Enter SABLE
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/library" className="transition hover:text-white">
                    Library
                  </Link>
                  <button
                    type="button"
                    className="rounded-full bg-white px-5 py-3 font-medium text-black transition hover:opacity-90"
                  >
                    Upgrade
                  </button>
                </>
              )}
            </nav>
          </header>

          <div className="flex flex-1 items-center">
            <div className="max-w-[720px] pb-16 pt-12 md:pt-16">
              <p className="text-sm font-medium tracking-wide text-orange-300/90">
                ● A new home for music listeners
              </p>

              <h1 className="mt-6 text-[3.4rem] font-semibold leading-[0.92] tracking-tight sm:text-[4.4rem] lg:text-[5.4rem]">
                Discover what
                <br />
                moves you next.
              </h1>

              <p className="mt-6 max-w-[620px] text-lg leading-8 text-white/72">
                Step into a darker, more intentional listening experience built
                for discovery, repeat plays, and the kind of music that stays
                with you.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                {!isLoggedIn ? (
                  <>
                    <Link
                      to="/signup"
                      className="rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:opacity-90"
                    >
                      Enter SABLE
                    </Link>

                    <Link
                      to="/login"
                      className="rounded-full border border-white/18 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white transition hover:border-white/28 hover:bg-white/[0.08]"
                    >
                      Log in
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/library"
                      className="rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:opacity-90"
                    >
                      Open Library
                    </Link>

                    <button
                      type="button"
                      className="rounded-full border border-white/18 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white transition hover:border-white/28 hover:bg-white/[0.08]"
                    >
                      Upgrade
                    </button>
                  </>
                )}
              </div>

              <div className="mt-9 flex items-center gap-4">
                <div className="flex -space-x-2">
                  <div className="h-10 w-10 rounded-full border border-white/12 bg-white/12" />
                  <div className="h-10 w-10 rounded-full border border-white/12 bg-white/12" />
                  <div className="h-10 w-10 rounded-full border border-white/12 bg-white/12" />
                </div>

                <p className="text-sm text-white/58">
                  Join listeners moving through late-night R&B, pop, and acoustic
                  drops.
                </p>
              </div>
            </div>
          </div>

          <div className="pb-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {featureCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[1.65rem] border border-white/10 bg-black/25 p-6 backdrop-blur-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-400/12 text-orange-300">
                      ●
                    </div>
                    <p className="text-sm text-white/62">{card.eyebrow}</p>
                  </div>

                  <h3 className="mt-4 text-[1.45rem] font-semibold tracking-tight text-white">
                    {card.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-white/66">
                    {card.body}
                  </p>

                  <div className="mt-5 h-[3px] w-10 rounded-full bg-orange-400/90" />
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-white/8 pt-6">
              <div className="flex flex-wrap items-center gap-x-10 gap-y-4 text-[1.05rem] text-white/45">
                {logos.map((logo) => (
                  <span key={logo}>{logo}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}