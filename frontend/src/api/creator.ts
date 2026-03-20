import { API_BASE_URL } from "../config";
import { getToken } from "./auth";

export type CreatorTrack = {
    id: number;
    title: string;
    state: string;
    tier: string;
    audio_s3_key: string | null;
    artwork_s3_key: string | null;
    created_at: string;
    published_at: string | null;
    tags: string[];
};

export type CreatorTracksResponse = {
    tracks: CreatorTrack[];
};

export type CreateDraftResponse = {
    track_id: number;
    audio_s3_key: string;
    audio_upload_url: string;
    artwork_s3_key: string;
    artwork_upload_url: string;
};

function authHeaders(): HeadersInit {
    const token = getToken();

    if (!token) {
        return {};
    }

    return {
        Authorization: `Bearer ${token}`,
    };
}

export async function fetchCreatorTracks(): Promise<CreatorTrack[]> {
    const res = await fetch(`${API_BASE_URL}/creator/tracks`, {
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.detail || "Failed to fetch creator tracks");
    }

    return (data as CreatorTracksResponse).tracks ?? [];
}

export async function createDraft(input: {
    title: string;
    audioFile: File;
    artworkFile: File;
}): Promise<CreateDraftResponse> {
    const audioExt = input.audioFile.name.split(".").pop()?.toLowerCase() || "";
    const artworkExt = input.artworkFile.name.split(".").pop()?.toLowerCase() || "";

    const res = await fetch(`${API_BASE_URL}/creator/tracks`, {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            title: input.title,
            audio_ext: audioExt,
            audio_content_type: input.audioFile.type,
            artwork_ext: artworkExt,
            artwork_content_type: input.artworkFile.type,
        }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.detail || "Failed to create draft");
    }

    return data as CreateDraftResponse;
}

export async function uploadFileToPresignedUrl(url: string, file: File) {
    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": file.type,
        },
        body: file,
    });

    if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`);
    }
}

export async function publishCreatorTrack(
    trackId: number,
    tier: "PUBLIC" | "SUBSCRIBER"
) {
    const res = await fetch(`${API_BASE_URL}/creator/tracks/${trackId}/publish`, {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.detail || "Failed to publish track");
    }

    return data;
}