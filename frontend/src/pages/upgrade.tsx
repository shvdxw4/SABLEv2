import { useState } from "react";
import { Link } from "react-router-dom";
import { createBillingCheckout, type BillingInterval } from "../api/billing";
import { useAuth } from "../auth/AuthContext";

export default function Upgrade() {
    const { token, user } = useAuth();

    const [billingInterval, setBillingInterval] =
        useState<BillingInterval>("monthly");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const isActiveSubscriber = user?.subscription_status === "ACTIVE";

    async function handleCheckout() {
        if (!token) {
            setError("You must be logged in to upgrade.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const data = await createBillingCheckout(billingInterval, token);

            if (!data?.url) {
                throw new Error("Checkout URL missing from server response.");
            }

            window.location.href = data.url;
        } catch (e: any) {
            setError(e?.message ?? "Failed to start checkout.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-8 backdrop-blur-md">
                <p className="text-sm uppercase tracking-[0.16em] text-orange-300/80">
                    Upgrade
                </p>

                <h1 className="mt-3 text-[3rem] font-semibold tracking-tight text-white">
                    Go Subscriber
                </h1>

                <p className="mt-4 max-w-2xl text-base text-white/60">
                    Unlock exclusive drops, deeper access, and future premium listening
                    experiences. The public catalog stays open. Subscription is for the
                    extra layer.
                </p>

                {isActiveSubscriber && (
                    <div className="mt-6 rounded-xl border border-orange-400/20 bg-orange-400/10 px-4 py-3 text-sm text-orange-200">
                        Your subscriber access is already active.
                    </div>
                )}

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => setBillingInterval("monthly")}
                        className={`rounded-[1.5rem] border p-6 text-left transition ${billingInterval === "monthly"
                            ? "border-orange-400/30 bg-orange-400/10"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                            }`}
                    >
                        <p className="text-sm uppercase tracking-[0.12em] text-white/45">
                            Monthly
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-white">$4.99</p>
                        <p className="mt-2 text-sm text-white/55">Billed every month</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setBillingInterval("yearly")}
                        className={`rounded-[1.5rem] border p-6 text-left transition ${billingInterval === "yearly"
                            ? "border-orange-400/30 bg-orange-400/10"
                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                            }`}
                    >
                        <p className="text-sm uppercase tracking-[0.12em] text-white/45">
                            Yearly
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-white">$49.99</p>
                        <p className="mt-2 text-sm text-white/55">Better long-term value</p>
                    </button>
                </div>

                <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-lg font-medium text-white">What you get</h2>

                    <div className="mt-4 space-y-3 text-sm text-white/65">
                        <p>• Access to exclusive subscriber-only content</p>
                        <p>• Early drops and future premium releases</p>
                        <p>• A cleaner premium listener path as SABLE expands</p>
                    </div>
                </div>

                {error && (
                    <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                        {error}
                    </p>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                    {isActiveSubscriber ? (
                        <Link
                            to="/manage-plan"
                            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:opacity-90"
                        >
                            Manage Plan
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={handleCheckout}
                            disabled={submitting}
                            className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? "Redirecting…" : "Continue to Checkout"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}