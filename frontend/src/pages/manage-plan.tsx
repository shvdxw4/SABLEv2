import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { cancelSubscription } from "../api/billing";

export default function ManagePlan() {
    const { user, token, refreshUser } = useAuth();
    const navigate = useNavigate();

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const isActiveSubscriber = user?.subscription_status === "ACTIVE";

    async function handleCancelSubscription() {
        if (!token) {
            setError("You must be logged in.");
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to cancel your subscription at the end of the current billing period?"
        );

        if (!confirmed) return;

        setSubmitting(true);
        setError("");
        setMessage("");

        try {
            await cancelSubscription(token);
            await refreshUser();
            setMessage("Your subscription has been set to cancel at period end.");
        } catch (e: any) {
            setError(e?.message ?? "Failed to cancel subscription.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-8 backdrop-blur-md">
                <p className="text-sm uppercase tracking-[0.16em] text-orange-300/80">
                    Manage Plan
                </p>

                <h1 className="mt-3 text-[2.5rem] font-semibold tracking-tight text-white">
                    {isActiveSubscriber
                        ? "Your subscription is active"
                        : "You’re on the free tier"}
                </h1>

                <p className="mt-4 text-white/60">
                    {isActiveSubscriber
                        ? "Your subscriber access is active. You can keep your plan or cancel it when you're ready."
                        : "Upgrade to unlock exclusive subscriber-only content and future premium releases."}
                </p>

                <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
                    <p className="text-sm text-white/45">Current status</p>
                    <p className="mt-2 text-xl font-medium text-white">
                        {user?.subscription_status || "FREE"}
                    </p>
                </div>

                {message && (
                    <p className="mt-6 rounded-xl border border-orange-400/20 bg-orange-400/10 px-4 py-3 text-sm text-orange-200">
                        {message}
                    </p>
                )}

                {error && (
                    <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                        {error}
                    </p>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                    {isActiveSubscriber ? (
                        <>
                            <button
                                type="button"
                                onClick={handleCancelSubscription}
                                disabled={submitting}
                                className="rounded-full border border-red-400/20 bg-red-400/10 px-6 py-3 text-sm font-medium text-red-200 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {submitting ? "Canceling..." : "Cancel Subscription"}

                            </button>

                            <button
                                type="button"
                                onClick={() => navigate("/home")}
                                className="rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
                            >
                                Back to Home
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/upgrade"
                                className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:opacity-90"
                            >
                                Upgrade Now
                            </Link>

                            <button
                                type="button"
                                onClick={() => navigate("/home")}
                                className="rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
                            >
                                Maybe Later
                            </button>
                        </>
                    )}
                </div>

                {isActiveSubscriber && (
                    <p className="mt-6 text-sm text-white/40">
                        Cancellation is applied at the end of the current billing period.
                    </p>
                )}
            </div>
        </div>
    );
}