import { API_BASE_URL } from "../config";
import { getToken } from "./auth";

export type ListenerTrack = {
    id: number;
    title: string;
    tier: "PUBLIC" | "SUBSCRIBER";
    state: string;
    creator_id: number;
    published_at: string | null;
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

export async function fetchTracks(): Promise<ListenerTrack[]> {
    const res = await fetch(`${API_BASE_URL}/tracks`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.detail || "Failed to load tracks");
    }

    return data.items ?? [];
}

export async function fetchTrackStreamUrl(trackId: number): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/tracks/${trackId}/stream`, {
        method: "GET",
        headers: authHeaders(),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.detail || "Failed to load stream");
    }

    return data.url;
}