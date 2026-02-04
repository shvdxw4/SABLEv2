import { API_BASE_URL } from "../config"

export async function fetchHealth(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) {
        throw new Error(`Health check failed: ${res.status}`);
    }
    return res.json();
}