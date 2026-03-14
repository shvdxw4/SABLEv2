import { useEffect, useMemo, useState } from "react";
import {
  createDraft,
  fetchCreatorTracks,
  publishCreatorTrack,
  type CreatorTrack,
  uploadFileToPresignedUrl,
} from "../api/creator";

type CreatorTracksState =
  | { status: "loading" }
  | { status: "error"; detail: string }
  | { status: "ok"; tracks: CreatorTrack[] };

export default function Upload() {
  const [state, setState] = useState<CreatorTracksState>({ status: "loading" });

  const [title, setTitle] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [publishError, setPublishError] = useState<Record<number, string>>({});

  async function loadCreatorTracks() {
    setState({ status: "loading" });

    try {
      const tracks = await fetchCreatorTracks();
      setState({ status: "ok", tracks });
    } catch (e: any) {
      setState({
        status: "error",
        detail: e?.message ?? "Unknown error",
      });
    }
  }

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const tracks = await fetchCreatorTracks();
        if (!alive) return;
        setState({ status: "ok", tracks });
      } catch (e: any) {
        if (!alive) return;
        setState({
          status: "error",
          detail: e?.message ?? "Unknown error",
        });
      }
    }

    setState({ status: "loading" });
    run();

    return () => {
      alive = false;
    };
  }, []);

  async function handleCreateDraft() {
    setCreateError("");

    if (!audioFile) {
      setCreateError("Select an audio file first.");
      return;
    }

    if (!artworkFile) {
      setCreateError("Select an artwork file first.");
      return;
    }

    setCreating(true);

    try {
      const draft = await createDraft({
        title: title.trim() || "Untitled",
        audioFile,
        artworkFile,
      });

      await uploadFileToPresignedUrl(draft.audio_upload_url, audioFile);
      await uploadFileToPresignedUrl(draft.artwork_upload_url, artworkFile);

      setTitle("");
      setAudioFile(null);
      setArtworkFile(null);

      await loadCreatorTracks();
    } catch (e: any) {
      setCreateError(e?.message ?? "Failed to create draft");
    } finally {
      setCreating(false);
    }
  }

  async function handlePublish(
    trackId: number,
    tier: "PUBLIC" | "SUBSCRIBER"
  ) {
    setPublishError((prev) => ({ ...prev, [trackId]: "" }));
    setPublishingId(trackId);

    try {
      await publishCreatorTrack(trackId, tier);
      await loadCreatorTracks();
    } catch (e: any) {
      setPublishError((prev) => ({
        ...prev,
        [trackId]: e?.message ?? "Failed to publish track",
      }));
    } finally {
      setPublishingId(null);
    }
  }

  const drafts =
    state.status === "ok"
      ? state.tracks.filter((t) => t.state === "DRAFT")
      : [];

  const published =
    state.status === "ok"
      ? state.tracks.filter((t) => t.state === "PUBLISHED")
      : [];

  const removed =
    state.status === "ok"
      ? state.tracks.filter((t) => t.state === "REMOVED")
      : [];

  const draftCount = useMemo(() => drafts.length, [drafts]);
  const publishedCount = useMemo(() => published.length, [published]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          Creator Workspace
        </h1>
        <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
          Manage drafts, prepare uploads, and publish intentionally.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
          <p className="text-xs uppercase tracking-wide text-black/50 dark:text-sable-muted">
            Drafts
          </p>
          <p className="mt-2 text-2xl font-semibold">{draftCount}</p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
          <p className="text-xs uppercase tracking-wide text-black/50 dark:text-sable-muted">
            Published
          </p>
          <p className="mt-2 text-2xl font-semibold">{publishedCount}</p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
          <p className="text-xs uppercase tracking-wide text-black/50 dark:text-sable-muted">
            Removed
          </p>
          <p className="mt-2 text-2xl font-semibold">{removed.length}</p>
        </div>
      </div>

      {state.status === "loading" && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">
            Loading creator workspace…
          </p>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">
            <span className="font-medium text-red-600">Error</span> —{" "}
            {state.detail}
          </p>
        </div>
      )}

      {state.status === "ok" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
            <div className="mb-4">
              <h2 className="text-lg font-medium">Recent Drafts</h2>
              <p className="mt-1 text-sm text-black/60 dark:text-sable-muted">
                Tracks waiting for final review and publish.
              </p>
            </div>

            {drafts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/10 p-4 text-sm text-black/60 dark:border-sable-border dark:text-sable-muted">
                No drafts yet. New uploads will land here first.
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map((track) => (
                  <div
                    key={track.id}
                    className="rounded-xl border border-black/10 p-4 dark:border-sable-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{track.title}</p>
                        <p className="mt-1 text-xs text-black/60 dark:text-sable-muted">
                          Draft #{track.id}
                        </p>
                      </div>

                      <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs text-black/70 dark:border-sable-border dark:bg-white/5 dark:text-sable-muted">
                        {track.state}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {track.tags.length > 0 ? (
                        track.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs text-black/70 dark:border-sable-border dark:bg-white/5 dark:text-sable-muted"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-black/50 dark:text-sable-muted">
                          No tags yet
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={publishingId === track.id}
                        onClick={() => {
                          const ok = window.confirm(
                            `Publish "${track.title}" as PUBLIC?`
                          );
                          if (!ok) return;
                          handlePublish(track.id, "PUBLIC");
                        }}
                        className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sable-text dark:text-sable-bg"
                      >
                        {publishingId === track.id
                          ? "Publishing…"
                          : "Publish Public"}
                      </button>

                      <button
                        type="button"
                        disabled={publishingId === track.id}
                        onClick={() => {
                          const ok = window.confirm(
                            `Publish "${track.title}" as SUBSCRIBER-only?`
                          );
                          if (!ok) return;
                          handlePublish(track.id, "SUBSCRIBER");
                        }}
                        className="rounded-full border border-black/15 px-4 py-2 text-xs font-medium text-black transition hover:border-black/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-sable-border dark:text-sable-text dark:hover:border-sable-muted"
                      >
                        {publishingId === track.id
                          ? "Publishing…"
                          : "Publish Subscriber"}
                      </button>
                    </div>

                    {publishError[track.id] && (
                      <p className="mt-2 text-xs text-red-600">
                        {publishError[track.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
            <div className="mb-4">
              <h2 className="text-lg font-medium">Create Draft</h2>
              <p className="mt-1 text-sm text-black/60 dark:text-sable-muted">
                Uploads always enter as drafts and must be published manually.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Draft title"
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-sable-border dark:bg-sable-bg dark:text-sable-text dark:focus:border-sable-muted"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Audio file
                </label>
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.aac,.ogg,audio/*"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
                {audioFile && (
                  <p className="mt-2 text-xs text-black/60 dark:text-sable-muted">
                    Selected: {audioFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Artwork</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/*"
                  onChange={(e) => setArtworkFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
                {artworkFile && (
                  <p className="mt-2 text-xs text-black/60 dark:text-sable-muted">
                    Selected: {artworkFile.name}
                  </p>
                )}
              </div>

              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}

              <button
                onClick={handleCreateDraft}
                disabled={creating}
                className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sable-text dark:text-sable-bg"
              >
                {creating ? "Creating draft…" : "Create draft"}
              </button>

              <div className="rounded-xl border border-dashed border-black/10 p-4 text-xs text-black/60 dark:border-sable-border dark:text-sable-muted">
                Uploads land in drafts first. Publishing happens separately after
                review.
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
            <div className="mb-4">
              <h2 className="text-lg font-medium">Published</h2>
              <p className="mt-1 text-sm text-black/60 dark:text-sable-muted">
                Live tracks that have already cleared draft review.
              </p>
            </div>

            {published.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/10 p-4 text-sm text-black/60 dark:border-sable-border dark:text-sable-muted">
                Nothing published yet.
              </div>
            ) : (
              <div className="space-y-3">
                {published.map((track) => (
                  <div
                    key={track.id}
                    className="rounded-xl border border-black/10 p-4 dark:border-sable-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{track.title}</p>
                        <p className="mt-1 text-xs text-black/60 dark:text-sable-muted">
                          Published #{track.id}
                        </p>
                      </div>

                      <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs text-black/70 dark:border-sable-border dark:bg-white/5 dark:text-sable-muted">
                        {track.tier}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {track.tags.length > 0 ? (
                        track.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs text-black/70 dark:border-sable-border dark:bg-white/5 dark:text-sable-muted"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-black/50 dark:text-sable-muted">
                          No tags
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}