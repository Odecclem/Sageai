"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { TopUpModal } from "@/components/TopUpModal";
import { LiveShowcasePlayer } from "@/components/LiveShowcasePlayer";
import { BrandLogo } from "@/components/BrandLogo";
import { PERSONA_PRESETS, PRICING_PACKS } from "@/lib/store";
import {
  Sparkles,
  Zap,
  Radio,
  Video,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Monitor,
  Clock,
  Laptop,
  Check,
  LayoutDashboard,
} from "lucide-react";

export default function LandingPage() {
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Do I need a high-end gaming GPU or a green screen?",
      a: "No. All heavy AI visual reenactment executes on our cloud GPU video pipeline or lightweight browser neural network. A standard laptop with a built-in webcam is all you need.",
    },
    {
      q: "How does the OBS integration work?",
      a: "When you open the Creator Studio, you receive a private OBS Browser Source URL. Simply add a new Browser Source in OBS Studio (1920x1080 @ 60 FPS), and your transformed video streams directly into Twitch, YouTube, Kick, or TikTok.",
    },
    {
      q: "How does the credit billing model work?",
      a: "You only pay while your stream is actively live at 1 credit per second (60 credits per minute). When you pause or stop, credit consumption stops instantly. Credits never expire and there are no recurring monthly subscriptions.",
    },
    {
      q: "Can I upload custom photos or characters?",
      a: "Yes. In the Creator Studio, you can upload any character portrait (anime, 3D render, realistic portrait). The AI reenacts your facial expressions, head movements, and speech in real time.",
    },
    {
      q: "Is payment processing secure?",
      a: "Yes. All credit pack transactions are processed via Stripe with 256-bit SSL encryption. We never store payment card credentials on our servers.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600/10 selection:text-blue-900">
      <Navbar onOpenTopUp={() => setIsTopUpOpen(true)} />

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-xs mb-8">
            <Radio className="h-3.5 w-3.5 text-blue-600" />
            <span>REAL-TIME AI VIDEO · OBS BROWSER SOURCE COMPATIBLE</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.1]">
            Transform your stream with{" "}
            <span className="text-blue-600">
              intelligent AI personas
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Turn your webcam into an AI character in real time. Stream as an anime hero, cyberpunk avatar, or custom portrait with zero green screen, no GPU setup, and sub-second latency.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-7 py-3.5 text-sm font-semibold text-white shadow-xs transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Go to Dashboard</span>
            </Link>

            <Link
              href="/studio"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Video className="h-4 w-4 text-blue-600" />
              <span>Creator Studio</span>
            </Link>

            <Link
              href="/pricing"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-7 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>Credit Packs</span>
            </Link>
          </div>

          {/* Metrics strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Sub-second 60 FPS streaming</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>Direct OBS Browser Source</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              <span>Pay as you stream (1 cred/sec)</span>
            </div>
          </div>
        </div>

        {/* Live Synchronized Video Showcase Player */}
        <div className="mt-16 max-w-5xl mx-auto px-4 sm:px-6">
          <LiveShowcasePlayer />
        </div>
      </section>

      {/* Feature Pillar Grid: 3 Steps */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 font-mono">HOW IT WORKS</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Three simple steps to stream with AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
              <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 border border-blue-200/60">
                <Laptop className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono text-blue-600 font-bold uppercase tracking-wider">Step 01</span>
              <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">Turn On Your Webcam</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plug in any standard webcam or use your built-in laptop camera. No specialized capture cards, green screens, or lighting rigs required.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 border border-indigo-200/60">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono text-indigo-600 font-bold uppercase tracking-wider">Step 02</span>
              <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">Pick or Upload Persona</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose Anime Shonen, Cyberpunk 2099, 3D Pixar, or upload your own custom photo. Adjust prompt steering and intensity sliders in real time.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
              <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-6 border border-slate-200">
                <Monitor className="h-5 w-5" />
              </div>
              <span className="text-xs font-mono text-slate-700 font-bold uppercase tracking-wider">Step 03</span>
              <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">Paste into OBS Studio</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Copy your private OBS Browser Source link. Paste it directly into OBS Studio and broadcast to Twitch, YouTube, Kick, or Discord.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Personas Showcase */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 font-mono">PERSONA GALLERY</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Curated personas ready to stream
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Each persona features real-time facial expression tracking and automatic lip-syncing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PERSONA_PRESETS.map((persona) => (
              <div
                key={persona.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-xs hover:border-blue-400 transition-colors"
              >
                <div>
                  <div className="aspect-square w-full rounded-xl bg-slate-100 overflow-hidden relative mb-4 border border-slate-200 flex flex-col items-center justify-center p-4">
                    {persona.imageUrl ? (
                      <img
                        src={persona.imageUrl}
                        alt={persona.name}
                        className="h-full w-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center space-y-2">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{persona.category}</span>
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 rounded-md bg-white/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-slate-700 border border-slate-200 font-semibold shadow-xs">
                      {persona.filterMode}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {persona.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {persona.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">1 credit / sec</span>
                  <Link
                    href="/studio"
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <span>Launch</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 font-mono">TRANSPARENT PRICING</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Pay as you stream · No recurring fees
            </p>
            <p className="mt-2 text-xs text-slate-600">
              Only consume credits while your camera is actively live. Credits never expire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`relative rounded-2xl p-7 flex flex-col justify-between border transition-all ${
                  pack.popular
                    ? "border-blue-500 bg-white shadow-md ring-1 ring-blue-500"
                    : "border-slate-200 bg-white shadow-xs"
                }`}
              >
                {pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-base font-bold text-slate-900">{pack.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">${pack.priceUsd}</span>
                    <span className="text-xs text-slate-500 font-mono">USD</span>
                  </div>
                  <div className="text-xs text-blue-600 font-semibold mt-1">
                    {pack.credits.toLocaleString()} Credits (~{pack.minutesApprox} min live)
                  </div>

                  <div className="my-5 border-t border-slate-100" />

                  <ul className="space-y-2.5 text-xs text-slate-600">
                    {pack.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setIsTopUpOpen(true)}
                  className={`mt-6 w-full rounded-xl py-3 text-xs font-bold transition-colors cursor-pointer ${
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
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-600 mt-1">Everything you need to know about Sage AI Live</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-colors shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Company Footer */}
      <footer className="pt-14 pb-12 bg-slate-100 text-xs text-slate-600 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1: Brand & Bio */}
            <div className="space-y-3 md:col-span-1">
              <BrandLogo size="sm" withLink={false} />
              <p className="text-slate-500 text-xs leading-relaxed">
                Commercial real-time neural face reenactment platform. Sub-second WebRTC streaming for creators, VTubers, and virtual broadcasting.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-700 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>PCI-DSS Encrypted Payments</span>
              </div>
            </div>

            {/* Col 2: Platform */}
            <div className="space-y-2.5">
              <div className="text-slate-900 font-semibold text-xs uppercase tracking-wider">Platform</div>
              <ul className="space-y-2">
                <li>
                  <Link href="/studio" className="hover:text-slate-900 transition-colors">
                    Live Creator Studio
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-slate-900 transition-colors">
                    Credit Packs & Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/settings" className="hover:text-slate-900 transition-colors">
                    Customer Portal & Wallet
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="hover:text-slate-900 transition-colors">
                    Administrator Control
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Integrations & OBS */}
            <div className="space-y-2.5">
              <div className="text-slate-900 font-semibold text-xs uppercase tracking-wider">Broadcast</div>
              <ul className="space-y-2">
                <li>
                  <Link href="/obs" className="hover:text-slate-900 transition-colors">
                    OBS Browser Source
                  </Link>
                </li>
                <li>
                  <Link href="/studio" className="hover:text-slate-900 transition-colors">
                    Virtual Webcam Guide
                  </Link>
                </li>
                <li>
                  <span className="text-slate-500">Discord & Telegram Virtual Cam</span>
                </li>
                <li>
                  <span className="text-slate-500">XMax Cloud GPU Streaming</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Legal & Compliance */}
            <div className="space-y-2.5">
              <div className="text-slate-900 font-semibold text-xs uppercase tracking-wider">Legal & Trust</div>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="hover:text-slate-900 transition-colors">
                    Terms of Service & AUP
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                    Privacy & Ephemeral Biometrics
                  </Link>
                </li>
                <li>
                  <Link href="/refunds" className="hover:text-slate-900 transition-colors">
                    14-Day Refund Policy
                  </Link>
                </li>
                <li>
                  <span className="text-slate-500 font-mono text-[11px]">support@sage.ai</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              © 2026 Sage AI Technologies Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-slate-700">Terms</Link>
              <Link href="/privacy" className="hover:text-slate-700">Privacy</Link>
              <Link href="/refunds" className="hover:text-slate-700">Refunds</Link>
              <Link href="/admin/login" className="hover:text-slate-700">Admin</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* TopUp Modal */}
      <TopUpModal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} />
    </div>
  );
}
