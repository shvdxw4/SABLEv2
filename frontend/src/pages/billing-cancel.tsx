import { Link } from "react-router-dom";

export default function BillingCancel() {
    return (
        <div className="mx-auto max-w-3xl">
            <div className="rounded-[2rem] border border-white/10 bg-black/20 p-8 backdrop-blur-md">
                <p className="text-sm uppercase tracking-[0.16em] text-white/45">
                    Billing
                </p>

                <h1 className="mt-3 text-[2.5rem] font-semibold tracking-tight text-white">
                    Checkout canceled
                </h1>

                <p className="mt-4 text-white/60">
                    No worries. Your subscription was not changed. You can return to the
                    upgrade page any time.
                </p>

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
                        Go to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}