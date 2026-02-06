import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { uploadAudio, type UploadResponse } from "../api/upload";
import { API_BASE_URL } from "../config";

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; filename: string }
  | { status: "success"; data: UploadResponse }
  | { status: "error"; detail: string };

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>({ status: "idle" });

  const isValidType = useMemo(() => {
    if (!file) return true;
    const name = file.name.toLowerCase();
    return name.endsWith(".mp3") || name.endsWith(".wav");
  }, [file]);

  async function handleUpload() {
    if (!file) {
      setState({ status: "error", detail: "Pick an mp3 or wav first." });
      return;
    }
    if (!isValidType) {
      setState({ status: "error", detail: "Only .mp3 or .wav files are allowed." });
      return;
    }

    setState({ status: "uploading", filename: file.name });

    try {
      const data = await uploadAudio(file);
      setState({ status: "success", data });
    } catch (e: any) {
      setState({ status: "error", detail: e?.message ?? "Upload failed." });
    }
  }

  const waveformUrl =
    state.status === "success"
      ? `${API_BASE_URL}/audio/${encodeURIComponent(state.data.filename)}/waveform`
      : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Upload</h1>
        <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
          Upload an mp3/wav draft and generate a waveform instantly.
        </p>
      </div>

      {/* PICKER */}
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-sable-border dark:bg-sable-panel dark:shadow-soft">
        <label className="block text-sm font-medium">Select file</label>

        <input
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          className="mt-3 block w-full cursor-pointer text-sm text-black/70 file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90 dark:text-sable-muted dark:file:bg-sable-text dark:file:text-sable-bg"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setState({ status: "idle" });
          }}
        />

        {!isValidType && file && (
          <p className="mt-3 text-sm text-red-600">Only .mp3 or .wav files are allowed.</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={!file || !isValidType || state.status === "uploading"}
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sable-text dark:text-sable-bg"
          >
            {state.status === "uploading" ? "Uploading…" : "Upload"}
          </button>

          <Link
            to="/library"
            className="rounded-full border border-black/15 px-5 py-2 text-sm font-medium text-black transition hover:border-black/30 dark:border-sable-border dark:text-sable-text dark:hover:border-sable-muted"
          >
            Go to Library
          </Link>

          {file && (
            <span className="text-sm text-black/60 dark:text-sable-muted">
              Selected: {file.name}
            </span>
          )}
        </div>

        {/* STATUS */}
        <div className="mt-6">
          {state.status === "error" && (
            <div className="rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-sable-border dark:bg-sable-bg">
              <p className="text-black/70 dark:text-sable-muted">
                <span className="font-medium text-red-600">Error</span> — {state.detail}
              </p>
            </div>
          )}

          {state.status === "uploading" && (
            <div className="rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-sable-border dark:bg-sable-bg">
              <p className="text-black/70 dark:text-sable-muted">
                Uploading: <span className="font-medium">{state.filename}</span>
              </p>
            </div>
          )}

          {state.status === "success" && (
            <div className="rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-sable-border dark:bg-sable-bg">
              <p className="text-black/70 dark:text-sable-muted">
                <span className="font-medium text-black dark:text-sable-text">Uploaded</span> —{" "}
                {state.data.filename}
              </p>
              <p className="mt-1 text-black/60 dark:text-sable-muted">
                Duration:{" "}
                {typeof state.data.duration_sec === "number"
                  ? `${state.data.duration_sec}s`
                  : "—"}
              </p>

              {waveformUrl && (
                <div className="mt-4 overflow-hidden rounded-xl border border-black/10 dark:border-sable-border">
                  <img
                    src={waveformUrl}
                    alt="waveform"
                    className="h-24 w-full object-cover"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
