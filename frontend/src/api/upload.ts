import { API_BASE_URL } from "../config";

export type UploadResponse = {
  filename: string;
  duration_sec: number;
  uploaded_at?: string;
  audio_path?: string;
  waveform_image?: string;
};

export async function uploadAudio(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append("file", file);
    console.log("UPLOAD ->", `${API_BASE_URL}/audio?upload`);
    const res = await fetch(`${API_BASE_URL}/audio/upload`, {
        method: "POST",
        body: form,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Upload failed: ${res.status} ${text}`);
   }

  return res.json();
}
