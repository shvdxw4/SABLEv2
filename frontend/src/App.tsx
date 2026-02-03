import { useMemo, useState } from 'react'

function App() {
  const [dark, setDark] = useState(true);
  const rootClass = useMemo(() => (dark ? "dark" : ""), [dark]);

  return (
    <div className={rootClass}>
      <div className="min-h-screen bg-white text-black dark:bg-sable-bg dark:text-sable-text">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-white/80 backdrop-blur dark:border-sable-border dark:bg-sable-bg/80">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <div className="flex items-baseline gap-3">
              <span className="text-lg font-semibold tracking-wide">SABLE</span>
              <span className="text-sm text-black/60 dark:text-sable-muted">Monochromatic Heat
              </span>
            </div>
          
            <button
              onClick={() => setDark((v) => !v)}
              className="rounded-full border border-black/15 px-3 py-1.5 text-sm transition hover:border-black/30 dark:border-sable-border dark:hover:border-sable-muted"
            >
              {dark ? "Dark" : "Light"}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-10">
          <div className="mb-8">
            <h1 className="text-6xl font-semibold tracking-tight">
              A creator's private vault.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-sable-muted">
              Upload drafts. Preview waveforms. Share for fast feedback. Keep your
              ideas organized.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
              <p className="text-sm text-black/60 dark:text-sable-muted">Next</p>
              <p className="mt-2 text-lg font-medium">Upload</p>
              <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
                Drop an mp3/wav and instantly generate a waveform preview.
              </p>
              <div className="mt-4 h-1 w-12 rounded bg-sable-heat" />
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
              <p className="text-sm text-black/60 dark:text-sable-muted">Next</p>
              <p className="mt-2 text-lg font-medium">Library</p>
              <p className="mt -2 text-sm text-black/70 dark:text-sable-muted">
                Browse your drafts, search by tag, and stream instantly.
              </p>
              <div className="mt-4 h-1 w-12 rounded bg-sable-heat/60" />
            </div>

            <div className="rounded-2xl border border-black/10 bg-whtie p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
              <p className="text-sm text-black/60 dark:text-sable-muted">Later</p>
              <p className="mt-2 text-lg font-medium">Feedback</p>
              <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
                Share private links to get quick notes before release.
              </p>
            <div className="mt-4 h-1 w-12 rounded bg-sable-heat/30" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
