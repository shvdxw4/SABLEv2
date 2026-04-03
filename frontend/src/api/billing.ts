const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export type BillingInterval = "monthly" | "yearly";

export async function createBillingCheckout(
    interval: BillingInterval,
    token: string
) {
    const res = await fetch(`${API_BASE}/billing/checkout`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: interval }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create checkout session");
    }

    return res.json();
}

export async function cancelSubscription(token: string) {
    const res = await fetch(`${API_BASE}/billing/cancel-subscription`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to cancel subscription");
    }

    return res.json();
}