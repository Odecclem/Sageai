import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ShieldCheck, Lock, EyeOff, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - Sage AI Live",
  description: "Privacy and Data Protection Policy for Sage AI Live",
};

export default function PrivacyPage() {
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Data Protection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Privacy & Biometric Data Policy
            </h1>
            <p className="text-xs text-slate-500 mt-2 font-mono">
              Last Updated: October 2026 · Committed to Ephemeral Zero-Storage Processing
            </p>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-emerald-600" />
                1. Ephemeral Video Stream Processing
              </h2>
              <p>
                Your privacy is paramount. When you activate your camera in Creator Studio:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>
                  <strong>Zero Permanent Video Storage:</strong> Webcam video frames and audio streams are processed ephemerally in volatile memory (RAM) and immediately discarded frame-by-frame.
                </li>
                <li>
                  <strong>No Model Training:</strong> We never record, harvest, or utilize your facial video feed or uploaded character photos to train underlying foundation models.
                </li>
                <li>
                  <strong>Encrypted Transmission:</strong> When cloud GPU acceleration is enabled, streams travel across low-latency, end-to-end WebRTC DTLS/SRTP encrypted channels.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" />
                2. Information We Collect
              </h2>
              <p>We only collect minimal account information required to provide the service:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li>Account credentials: Name, email address, and cryptographic salted password hashes.</li>
                <li>Billing data: Transaction IDs, credit pack purchases, and credit balances. Payment card numbers are handled directly by Stripe and never touch our servers.</li>
                <li>Stream telemetry: Duration of live streams (seconds) for accurate billing deduction.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                3. Your Rights & Data Deletion
              </h2>
              <p>
                Under GDPR and CCPA regulations, you have the right to request an export of your account data or complete permanent deletion of your account and associated records. You can initiate data deletion at any time by contacting{" "}
                <span className="text-blue-600 font-mono">privacy@sage.ai</span>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
