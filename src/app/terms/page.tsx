import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { FileText, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service - Sage AI Live",
  description: "Terms of Service and Acceptable Use Policy for Sage AI Live Face Swapping Platform",
};

export default function TermsPage() {
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 mb-3">
              <FileText className="h-3.5 w-3.5" />
              <span>Legal Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Terms of Service & Acceptable Use Policy
            </h1>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              Last Updated: October 2026 · Effective Immediately for All Users
            </p>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                1. Acceptance of Terms
              </h2>
              <p>
                By creating an account, topping up streaming credits, or accessing Sage AI Live (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you are prohibited from using the platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                2. Mandatory Acceptable Use Policy (AI Face Reenactment)
              </h2>
              <p>
                Sage AI provides real-time neural face transformation technology designed for content creation, VTubing, comedy sketches, roleplay, and virtual production. You strictly agree NOT to use the service for:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Non-consensual deepfakes, harassment, defamation, or intimidation of any real individual.</li>
                <li>Impersonation of law enforcement, government officials, financial institutions, or election candidates.</li>
                <li>Fraudulent financial scams, identity verification bypass (KYC evasion), or unauthorized bank calls.</li>
                <li>Creating sexually explicit, violent, defamatory, or unlawful content.</li>
              </ul>
              <p className="text-rose-600 font-semibold mt-2">
                Violations result in immediate, non-refundable account termination and permanent IP blacklist.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                3. Credit Wallets & Pay-As-You-Stream Billing
              </h2>
              <p>
                Sage AI operates on a prepaid credit balance model. Streaming video transformations consume exactly 1 credit per second (60 credits per minute) while your stream is active.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Credits are credited to your account immediately upon successful payment confirmation.</li>
                <li>Credits do not expire as long as your account remains in good standing.</li>
                <li>All credit purchases are processed via encrypted payment gateways (e.g., Stripe).</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                4. Intellectual Property & Likeness Rights
              </h2>
              <p>
                When uploading reference character images, you warrant that you hold the legal right, license, or explicit consent to utilize the reference imagery. You retain all commercial rights to the output streams and videos you produce using Sage AI.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                5. Limitation of Liability
              </h2>
              <p>
                Sage AI and its operators provide the software on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Under no circumstances shall Sage AI be liable for any indirect, incidental, punitive, or consequential damages resulting from user-generated content or third-party streaming platform suspensions.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                6. Contact Information
              </h2>
              <p>
                For legal inquiries, copyright claims (DMCA), or compliance reports, contact our compliance team at{" "}
                <span className="text-blue-600 font-mono">legal@sage.ai</span>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
