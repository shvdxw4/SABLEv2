import { API_BASE_URL } from "../config";

export type AudioFile = {
    filename: string;
    size_bytes: number;
    last_modified: string;
    duration_sec: number | null;
    waveform_image: string;
};

export async function fetchAudioList(): Promise<AudioFile[]> {
    const res = await fetch (`${API_BASE_URL}/audio/`);
    if (!res.ok) throw new Error(`List failed: ${res.status}`);
    const data = await res.json();
    return data.audio_files as AudioFile[];
}