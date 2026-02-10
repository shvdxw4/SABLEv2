import { useEffect, useState } from "react";
import {
  fetchAudioList,
  updateAudioTags,
  deleteAudio,
  type AudioFile,
} from "../api/audio";
import { API_BASE_URL } from "../config";

type LibraryState =
  | { status: "loading" }
  | { status: "error"; detail: string }
  | { status: "empty" }
  | { status: "ok"; items: AudioFile[] };

export default function Library() {
  const [state, setState] = useState<LibraryState>({ status: "loading" });
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");
  const [draftTags, setDraftTags] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [deleteError, setDeleteError] = useState<Record<string, string>>({});
  const [waveOk, setWaveOk] = useState<Record<string, boolean>>({});

  function tagsToString(tags?: string[]) {
    return (tags ?? []).join(", ");
  }

  function parseTags(input: string) {
    return input
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  useEffect(() => {
    let alive = true;

    async function run() {
      setState({ status: "loading" });
      try {
        const items = await fetchAudioList();
        if (!alive) return;

        if (!items || items.length === 0) {
          setState({ status: "empty" });
        } else {
          setState({ status: "ok", items });
        }
      } catch (e: any) {
        if (!alive) return;
        setState({ status: "error", detail: e?.message ?? "Unknown error" });
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  const filteredItems =
    state.status === "ok"
      ? state.items.filter((item) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;

          const inName = item.filename.toLowerCase().includes(q);
          const inTags = (item.tags ?? []).some((t) =>
            t.toLowerCase().includes(q),
          );

          return inName || inTags;
        })
      : [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Library</h1>
        <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
          Your uploaded drafts, pulled live from the backend.
        </p>
      </div>

      <div className="mt-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by filename or tag…"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black/30 dark:border-sable-border dark:bg-sable-bg dark:text-sable-text dark:focus:border-sable-muted"
        />
      </div>

      {state.status === "loading" && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">Loading audio…</p>
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">
            <span className="font-medium text-red-600">Error</span> —{" "}
            {state.detail}
          </p>
          <p className="mt-2 text-black/60 dark:text-sable-muted">
            Check that the backend is online and CORS allows localhost.
          </p>
        </div>
      )}

      {state.status === "empty" && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">
            No audio yet. Upload a track to see it here.
          </p>
        </div>
      )}

      {query.trim() && filteredItems.length === 0 && (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-sable-border dark:bg-sable-panel">
          <p className="text-black/70 dark:text-sable-muted">
            No matches for “{query.trim()}”.
          </p>
        </div>
      )}

      {state.status === "ok" && (
        <div className="grid gap-4">
          {filteredItems.map((item) => {
            const waveformUrl = `${API_BASE_URL}/audio/${encodeURIComponent(
              item.filename,
            )}/waveform`;

            const streamUrl = `${API_BASE_URL}/audio/${encodeURIComponent(
              item.filename,
            )}/stream`;

            return (
              <div
                key={item.filename}
                className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-black/60 dark:text-sable-muted">
                      {item.last_modified}
                    </p>
                    <p className="mt-1 text-base font-medium">
                      {item.filename}
                    </p>
                    <p className="mt-1 text-sm text-black/70 dark:text-sable-muted">
                      Duration:{" "}
                      {item.duration_sec !== null
                        ? `${item.duration_sec}s`
                        : "—"}
                    </p>
                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {(item.tags ?? []).length > 0 ? (
                        (item.tags ?? []).map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs text-black/70 dark:border-sable-border dark:bg-white/5 dark:text-sable-muted"
                          >
                            {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-black/50 dark:text-sable-muted">
                          No tags yet
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setEditing((m) => ({
                            ...m,
                            [item.filename]: !m[item.filename],
                          }));
                          setDraftTags((m) => ({
                            ...m,
                            [item.filename]:
                              m[item.filename] ?? tagsToString(item.tags),
                          }));
                          setSaveError((m) => ({ ...m, [item.filename]: "" }));
                        }}
                        className="ml-auto rounded-full border border-black/15 px-3 py-1 text-xs transition hover:border-black/30 dark:border-sable-border dark:text-sable-text dark:hover:border-sable-muted"
                      >
                        {editing[item.filename] ? "Close" : "Edit tags"}
                      </button>
                    </div>

                    {editing[item.filename] && (
                      <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 dark:border-sable-border dark:bg-sable-panel">
                        <label className="block text-xs text-black/60 dark:text-sable-muted">
                          Comma-separated tags
                        </label>

                        <div className="mt-2 flex flex-col gap-2 md:flex-row">
                          <input
                            value={draftTags[item.filename] ?? ""}
                            onChange={(e) =>
                              setDraftTags((m) => ({
                                ...m,
                                [item.filename]: e.target.value,
                              }))
                            }
                            placeholder="draft, chorus, v1"
                            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-sable-border dark:bg-sable-bg dark:text-sable-text dark:focus:border-sable-muted"
                          />

                          <button
                            type="button"
                            disabled={saving[item.filename]}
                            onClick={async () => {
                              const input = draftTags[item.filename] ?? "";
                              const tags = parseTags(input);

                              setSaving((m) => ({
                                ...m,
                                [item.filename]: true,
                              }));
                              setSaveError((m) => ({
                                ...m,
                                [item.filename]: "",
                              }));

                              try {
                                const updated = await updateAudioTags(
                                  item.filename,
                                  tags,
                                );

                                // update UI in place (no refetch)
                                setState((prev) => {
                                  if (prev.status !== "ok") return prev;
                                  return {
                                    status: "ok",
                                    items: prev.items.map((x) =>
                                      x.filename === item.filename
                                        ? { ...x, tags: updated.tags }
                                        : x,
                                    ),
                                  };
                                });

                                setEditing((m) => ({
                                  ...m,
                                  [item.filename]: false,
                                }));
                              } catch (err: any) {
                                setSaveError((m) => ({
                                  ...m,
                                  [item.filename]:
                                    err?.message ?? "Failed to save tags",
                                }));
                              } finally {
                                setSaving((m) => ({
                                  ...m,
                                  [item.filename]: false,
                                }));
                              }
                            }}
                            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50 dark:bg-sable-text dark:text-sable-bg"
                          >
                            {saving[item.filename] ? "Saving…" : "Save"}
                          </button>
                        </div>

                        {saveError[item.filename] && (
                          <p className="mt-2 text-xs text-red-600">
                            {saveError[item.filename]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex w-full flex-col gap-2 md:w-80">
                    <audio controls className="w-full">
                      <source src={streamUrl} />
                    </audio>

                    <button
                      type="button"
                      disabled={deleting[item.filename]}
                      onClick={async () => {
                        const ok = window.confirm(
                          `Delete "${item.filename}"? This cannot be undone.`,
                        );
                        if (!ok) return;

                        setDeleting((m) => ({ ...m, [item.filename]: true }));
                        setDeleteError((m) => ({ ...m, [item.filename]: "" }));

                        try {
                          await deleteAudio(item.filename);

                          // remove from UI
                          setState((prev) => {
                            if (prev.status !== "ok") return prev;
                            const next = prev.items.filter(
                              (x) => x.filename !== item.filename,
                            );
                            return next.length === 0
                              ? { status: "empty" }
                              : { status: "ok", items: next };
                          });
                        } catch (err: any) {
                          setDeleteError((m) => ({
                            ...m,
                            [item.filename]: err?.message ?? "Failed to delete",
                          }));
                        } finally {
                          setDeleting((m) => ({
                            ...m,
                            [item.filename]: false,
                          }));
                        }
                      }}
                      className="rounded-xl border border-black/15 px-3 py-2 text-sm transition hover:border-black/30 disabled:opacity-50 dark:border-sable-border dark:text-sable-text dark:hover:border-sable-muted"
                    >
                      {deleting[item.filename] ? "Deleting…" : "Delete"}
                    </button>

                    {deleteError[item.filename] && (
                      <p className="text-xs text-red-600">
                        {deleteError[item.filename]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-black/10 dark:border-sable-border">
                  {waveOk[item.filename] === false ? (
                    <div className="flex h-20 items-center justify-center bg-black/5 text-xs text-black/60 dark:bg-white/5 dark:text-sable-muted">
                      Waveform unavailable (demo tier)
                    </div>
                  ) : (
                    <img
                      src={waveformUrl}
                      alt="waveform"
                      className="h-20 w-full object-cover"
                      onError={() =>
                        setWaveOk((m) => ({ ...m, [item.filename]: false }))
                      }
                      onLoad={() =>
                        setWaveOk((m) => ({ ...m, [item.filename]: true }))
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
