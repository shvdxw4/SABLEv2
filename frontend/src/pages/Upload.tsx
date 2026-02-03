export default function Upload() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight">Upload</h2>
      <p className="mt-2 text-sm text-black/70 dark:text-sable-muted">
        MVP: select an mp3/wav. We’ll wire this to the backend next block.
      </p>

      <div className="mt-6 rounded-2xl border border-black/10 bg-white p-6 dark:border-sable-border dark:bg-sable-panel">
        <label className="text-sm font-medium">Audio file</label>
        <input
          type="file"
          className="mt-3 block w-full cursor-pointer rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-sable-border dark:bg-sable-bg"
          accept=".mp3,.wav"
        />

        <button className="mt-5 rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 dark:bg-sable-text dark:text-sable-bg">
          Upload
        </button>

        <p className="mt-4 text-xs text-black/60 dark:text-sable-muted">
          Coming next: upload progress, response card, waveform preview.
        </p>
      </div>
    </div>
  );
}
