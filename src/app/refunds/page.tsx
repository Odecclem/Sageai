import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Receipt, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Refund Policy - Sage AI Live",
  description: "Credit Pack Refund Policy for Sage AI Live",
};

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600/10 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Homepage</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 shadow-xs space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-xs font-semibold text-cyan-700 mb-3">
              <Receipt className="h-3.5 w-3.5" />
              <span>Consumer Protection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Credit Pack Refund Policy
            </h1>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              Last Updated: October 2026 · Fair & Transparent Customer Terms
            </p>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                1. 14-Day Money-Back Guarantee for Unused Credits
              </h2>
              <p>
                If you purchase a credit pack and decide Sage AI is not right for you, you may request a 100% full refund on any <strong>completely unused credit pack</strong> within 14 days of purchase.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                2. Partially Consumed Credits
              </h2>
              <p>
                Streaming seconds that have already been live-metered and processed on our cloud GPU infrastructure cannot be refunded, as real computational resources were consumed. For partially used packs, prorated refunds may be issued upon review on the remaining unused balance.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                3. Technical Outages & Service Disruptions
              </h2>
              <p>
                If an unexpected platform failure or WebRTC disconnection prematurely terminates your live stream while credits were actively burning, our automated heartbeat safeguard pauses metering within 2 seconds. In addition, we will gladly credit your wallet for any lost time.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-indigo-600" />
                4. How to Request a Refund
              </h2>
              <p>
                To request a refund, email <span className="text-blue-600 font-mono">support@sage.ai</span> with your account email and transaction ID (found in your <Link href="/settings" className="underline text-blue-600">Account Settings</Link>). Most refunds are processed back to your original payment method within 3 to 5 business days.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
