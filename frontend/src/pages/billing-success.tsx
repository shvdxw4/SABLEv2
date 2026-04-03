import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

type SuccessState =
    | { status: "loading" }
    | { status: "success" }
    | { status: "error"; detail: string };

export default function BillingSuccess() {
    const [params] = useSearchParams();
    const { token } = useAuth();
    const [state, setState] = useState<SuccessState>({ status: "loading" });

    const hasConfirmedRef = useRef(false);

    useEffect(() => {
        const sessionId = params.get("session_id");

        if (!sessionId) {
            setState({
                status: "error",
                detail: "Missing session_id in return URL.",
            });
            return;
        }

        const confirmedSessionId = sessionId;

        if (!token) {
            setState({
                status: "error",
                detail: "You must be logged in to confirm billing success.",
            });
            return;
        }

        if (hasConfirmedRef.current) return;
        hasConfirmedRef.current = true;

        async function run() {
            try {
                const res = await fetch(
                    `${API_BASE}/billing/success?session_id=${encodeURIComponent(
                        confirmedSessionId
                    )}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to confirm billing success.");
                }

                setState({ status: "success" });
            } catch (e: any) {
                setState({
                    status: "error",
                    detail: e?.message ?? "Failed to confirm billing success.",
                });
            }
        }

        run();
    }, [params, token]);


    return (
        <div className="mx-auto max-w-3xl">
            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-8 backdrop-blur-md">
                {state.status === "loading" && (
                    <>
                        <p className="text-sm uppercase tracking-[0.16em] text-orange-300/80">
                            Billing
                        </p>
                        <h1 className="mt-3 text-[2.5rem] font-semibold tracking-tight text-white">
                            Confirming your subscription…
                        </h1>
                        <p className="mt-4 text-white/60">
                            We’re syncing your payment with your SABLE account.
                        </p>
                    </>
                )}

                {state.status === "success" && (
                    <>
                        <p className="text-sm uppercase tracking-[0.16em] text-orange-300/80">
                            Success
                        </p>
                        <h1 className="mt-3 text-[2.5rem] font-semibold tracking-tight text-white">
                            Subscription activated
                        </h1>
                        <p className="mt-4 text-white/60">
                            Your subscriber access is now active. You can head back into SABLE
                            and continue listening.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                to="/home"
                                className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:opacity-90"
                            >
                                Go to Home
                            </Link>

                            <Link
                                to="/manage-plan"
                                className="rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
                            >
                                Manage Plan

                            </Link>
                        </div>
                    </>
                )}

                {state.status === "error" && (
                    <>
                        <p className="text-sm uppercase tracking-[0.16em] text-red-300/80">
                            Billing Error
                        </p>
                        <h1 className="mt-3 text-[2.5rem] font-semibold tracking-tight text-white">
                            We couldn’t confirm your subscription
                        </h1>
                        <p className="mt-4 text-white/60">{state.detail}</p>

                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                to="/upgrade"
                                className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:opacity-90"
                            >
                                Back to Upgrade
                            </Link>

                            <Link
                                to="/home"
                                className="rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
                            >
                                Return Home
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}