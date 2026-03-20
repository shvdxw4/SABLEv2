import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-6xl font-semibold tracking-tight">
          A creator&apos;s private vault.
        </h1>

        <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-sable-muted">
          Create drafts, publish intentionally, and stream tracks through a
          role-aware platform built for creators and listeners.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 dark:bg-sable-text dark:text-sable-bg"
          >
            Enter SABLE
          </Link>

          <Link
            to="/login"
            className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium text-black transition hover:border-black/30 dark:border-sable-border dark:text-sable-text dark:hover:border-sable-muted"
          >
            Creator login
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
          <p className="text-sm text-black/60 dark:text-sable-muted">
            Creator flow
          </p>
          <p className="mt-2 text-lg font-medium">Draft to Publish</p>
          <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
            Upload audio and artwork, save as draft, and publish only when
            you&apos;re ready.
          </p>
          <div className="mt-4 h-1 w-12 rounded bg-sable-heat" />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
          <p className="text-sm text-black/60 dark:text-sable-muted">
            Listener flow
          </p>
          <p className="mt-2 text-lg font-medium">Library Streaming</p>
          <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
            Browse published tracks and stream them through the listener
            library.
          </p>
          <div className="mt-4 h-1 w-12 rounded bg-sable-heat/60" />
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
          <p className="text-sm text-black/60 dark:text-sable-muted">
            Role-aware access
          </p>
          <p className="mt-2 text-lg font-medium">Separate Spaces</p>
          <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
            Creators and listeners are routed into distinct spaces with
            protected access boundaries.
          </p>
          <div className="mt-4 h-1 w-12 rounded bg-sable-heat/30" />
        </div>
      </div>
    </div>
  );
}