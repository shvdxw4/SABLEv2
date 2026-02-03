const mock = [
  { name: "sable_run1.mp3", tags: ["draft", "run1"] },
  { name: "stevie_as.mp3", tags: ["idea", "test"] },
];

export default function Library() {
  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Library</h2>
          <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
            MVP: list tracks and tags. Backend integration is next block.
          </p>
        </div>

        <input
          placeholder="Search (next)"
          className="hidden w-60 rounded-full border border-black/10 bg-white px-4 py-2 text-sm dark:border-sable-border dark:bg-sable-panel sm:block"
        />
      </div>

      <div className="mt-6 grid gap-4">
        {mock.map((t) => (
          <div
            key={t.name}
            className="rounded-2xl border border-black/10 bg-white p-5 dark:border-sable-border dark:bg-sable-panel"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {t.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-black/10 px-2.5 py-1 text-xs text-black/70 dark:border-sable-border dark:text-sable-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button className="rounded-full border border-black/15 px-4 py-2 text-sm transition hover:border-black/30 dark:border-sable-border dark:hover:border-sable-muted">
                Play (next)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
