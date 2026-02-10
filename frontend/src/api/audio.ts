import { API_BASE_URL } from "../config";

export type AudioFile = {
  filename: string;
  size_bytes: number;
  last_modified: string;
  duration_sec: number | null;
  waveform_image: string;
  // Backend doesn't return tags in /audio/ list right now, so we treat it as optional in UI
  tags?: string[];
};

export async function fetchAudioList(): Promise<AudioFile[]> {
  const res = await fetch(`${API_BASE_URL}/audio/`, {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch audio list (${res.status})`);
  }

  const data = (await res.json()) as { audio_files: AudioFile[] };
  return data.audio_files ?? [];
}

export async function updateAudioTags(filename: string, tags: string[]) {
  const res = await fetch(
    `${API_BASE_URL}/audio/${encodeURIComponent(filename)}/edit`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to update tags (${res.status})`);
  }

  return res.json() as Promise<{
    message: string;
    filename: string;
    tags: string[];
    waveform_image: string | null;
  }>;
}

export async function deleteAudio(filename: string) {
  const res = await fetch(
    `${API_BASE_URL}/audio/${encodeURIComponent(filename)}`,
    { method: "DELETE" },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to delete (${res.status})`);
  }

  return res.json() as Promise<{ message: string }>;
}
