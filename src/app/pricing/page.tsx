"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { TopUpModal } from "@/components/TopUpModal";
import { PRICING_PACKS } from "@/lib/store";
import {
  Zap,
  Check,
  Calculator,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";

export default function PricingPage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [streamHoursPerWeek, setStreamHoursPerWeek] = useState(3);

  // 1 hour = 3600 seconds = 3600 credits (1 credit per second)
  const weeklyCreditsNeeded = streamHoursPerWeek * 3600;
  const monthlyCreditsNeeded = weeklyCreditsNeeded * 4;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600/10 selection:text-blue-900">
      <Navbar onOpenTopUp={() => setIsTopUpOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 mb-4 shadow-xs">
            <Zap className="h-3.5 w-3.5 text-blue-600" />
            <span>PAY AS YOU STREAM · ZERO RECURRING SUBSCRIPTIONS</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            Transparent, Credit-Based Pricing
          </h1>
          <p className="mt-4 text-base text-slate-600 max-w-2xl mx-auto">
            Streaming costs exactly 1 credit per second (60 credits per minute). You are only charged while your stream is live. Credits never expire.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {PRICING_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-2xl p-8 flex flex-col justify-between border transition-all ${
                pack.popular
                  ? "border-blue-500 bg-white shadow-md ring-1 ring-blue-500 md:scale-105 z-10"
                  : "border-slate-200 bg-white shadow-xs hover:border-slate-300"
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                  Most Popular
                </span>
              )}

              <div>
                <h2 className="text-lg font-bold text-slate-900">{pack.name}</h2>
                <p className="text-xs text-slate-500 mt-1">One-time purchase, instant wallet credit</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">${pack.priceUsd}</span>
                  <span className="text-xs text-slate-500 font-mono">USD</span>
                </div>
                {pack.priceNgn && (
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    or &#8358;{pack.priceNgn.toLocaleString()} NGN
                  </div>
                )}
                <div className="text-xs text-blue-600 font-semibold mt-1">
                  {pack.credits.toLocaleString()} Credits (~{pack.minutesApprox} min live)
                </div>

                <div className="my-6 border-t border-slate-100" />

                <ul className="space-y-3 text-xs text-slate-600">
                  {pack.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setIsTopUpOpen(true)}
                className={`mt-8 w-full rounded-xl py-3.5 text-xs font-bold transition-all cursor-pointer ${
                  pack.popular
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
                }`}
              >
                Buy {pack.name}
              </button>
            </div>
          ))}
        </div>

        {/* Interactive Usage Calculator */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-xs mb-16">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Streamer Usage Estimator</h2>
              <p className="text-xs text-slate-500">Calculate how many credits you need based on your broadcast schedule.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm text-slate-800 mb-2 font-medium">
                <span>How many hours do you stream per week?</span>
                <span className="font-mono text-blue-600 text-base font-bold">{streamHoursPerWeek} Hours / Week</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={streamHoursPerWeek}
                onChange={(e) => setStreamHoursPerWeek(parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1.5">
                <span>1 hr/wk (Casual)</span>
                <span>5 hrs/wk (Part-time)</span>
                <span>10 hrs/wk (Affiliate)</span>
                <span>20 hrs/wk (Full-time)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Estimated Weekly Requirement</span>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {weeklyCreditsNeeded.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-mono">credits</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Equals {Math.round(weeklyCreditsNeeded / 60)} minutes of live swap
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Estimated Monthly Requirement</span>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {monthlyCreditsNeeded.toLocaleString()} <span className="text-xs font-normal text-slate-500 font-mono">credits</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Recommended pack: {monthlyCreditsNeeded > 1500 ? "Pro Streamer Pack" : "Creator Pack"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reseller / Commercial Banner */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-blue-200 bg-blue-50/50 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
              <span>Commercial & Reseller Ready</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Want to sell streaming credits under your own brand?</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-lg leading-relaxed">
              This application is built with an enterprise white-label architecture. Connect your Flutterwave account to capture payments directly with complete financial ledger auditing.
            </p>
          </div>

          <Link
            href="/studio"
            className="shrink-0 flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-xs font-bold text-white transition-colors shadow-xs"
          >
            <span>Open Creator Studio</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      {/* TopUp Modal */}
      <TopUpModal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} />
    </div>
  );
}
