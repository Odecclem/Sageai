"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { TopUpModal } from "@/components/TopUpModal";
import { SAMPLE_CHARACTERS, PRICING_PACKS, PricingPlan } from "@/lib/store";
import { SafeUser } from "@/lib/userStore";
import { Transaction } from "@/lib/transactionStore";
import {
  LayoutDashboard,
  Video,
  CreditCard,
  Plus,
  Radio,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowRight,
  Flame,
  Sparkles,
  Play,
  Eye,
  EyeOff,
  Activity,
  Receipt,
  CheckCircle2,
  Tv,
  Laptop,
  Maximize2,
  RefreshCw,
  Zap,
  User,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(true);

  // Top Up Modal State
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState<string | undefined>(undefined);

  // Stream Key & OBS URL
  const [streamKey, setStreamKey] = useState("sage_live_stream");
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedObsUrl, setCopiedObsUrl] = useState(false);
  const [originUrl, setOriginUrl] = useState("");

  // Category filter for characters
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const fetchUserData = useCallback(async () => {
    try {
      setLoadingUser(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        const userKey = `sage_${data.user.id.replace("usr_", "")}_live`;
        setStreamKey(userKey);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoadingTxns(true);
      const res = await fetch("/api/billing/history");
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingTxns(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
    fetchUserData();
    fetchTransactions();
  }, [fetchUserData, fetchTransactions]);

  const obsUrl = `${originUrl}/obs?key=${streamKey}`;

  const copyToClipboard = (text: string, type: "key" | "url") => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      if (type === "key") {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
      } else {
        setCopiedObsUrl(true);
        setTimeout(() => setCopiedObsUrl(false), 2000);
      }
    }
  };

  const openTopUpWithPack = (packId?: string) => {
    setSelectedPackId(packId);
    setIsTopUpOpen(true);
  };

  const popOutObsWindow = () => {
    if (typeof window !== "undefined") {
      window.open(
        obsUrl,
        "SageObsStream",
        "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no"
      );
    }
  };

  const formatStreamSeconds = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0 min";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  // Filter characters
  const categories = ["All", "Viral Prank", "Celebrity", "VTuber", "Professional", "Gaming"];
  const filteredCharacters =
    selectedCategory === "All"
      ? SAMPLE_CHARACTERS
      : SAMPLE_CHARACTERS.filter((c) => c.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600/10 selection:text-blue-900">
      <Navbar onOpenTopUp={() => openTopUpWithPack()} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Creator Greeting & Quick Action Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl uppercase shadow-xs shrink-0">
              {currentUser ? currentUser.name.slice(0, 2) : <User className="h-7 w-7" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {currentUser ? `Welcome back, ${currentUser.name}` : "Creator Dashboard"}
                </h1>
                <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold">
                  {currentUser?.role === "admin" ? "Platform Admin" : "Verified Creator"}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Neural Cloud Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                {currentUser?.email ? (
                  <>
                    Account: <span className="font-mono text-slate-700">{currentUser.email}</span> · User ID:{" "}
                    <span className="font-mono text-slate-600">{currentUser.id}</span>
                  </>
                ) : (
                  "Manage real-time AI personas, OBS browser feeds, and wallet credits."
                )}
              </p>
            </div>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => openTopUpWithPack()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-blue-600" />
              <span>Top Up Wallet</span>
            </button>

            <button
              onClick={() => copyToClipboard(obsUrl, "url")}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              {copiedObsUrl ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">OBS Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy OBS Link</span>
                </>
              )}
            </button>

            <Link
              href="/studio"
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              <Video className="h-4 w-4" />
              <span>Launch Studio</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Wallet Balance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Wallet Balance
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {currentUser ? currentUser.creditBalance.toLocaleString() : "0"}
                <span className="text-xs font-normal text-slate-500 ml-1.5">credits</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>≈ {currentUser ? Math.floor(currentUser.creditBalance / 60) : 0} min stream time</span>
                <button
                  onClick={() => openTopUpWithPack()}
                  className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Stream Burn Rate */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Burn Rate
              </span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                1 cred<span className="text-sm font-normal text-slate-500 ml-1">/ sec</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>60 credits/min · Only while live</span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Seconds Streamed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Total Streamed
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {formatStreamSeconds(currentUser?.totalSecondsStreamed || 0)}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Lifetime AI swap duration</span>
              </div>
            </div>
          </div>

          {/* Card 4: OBS Virtual Cam Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                OBS Virtual Cam
              </span>
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Radio className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                1080p <span className="text-xs font-normal text-slate-500">60 FPS</span>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>Browser Source Ready</span>
                <button
                  onClick={popOutObsWindow}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-0.5"
                >
                  <Maximize2 className="h-3 w-3" /> Pop-Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Studio Persona Quick Launcher */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Ready-to-Stream Personas
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Launch the Creator Studio instantly with pre-configured neural character models.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Character Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.map((char) => (
              <div
                key={char.id}
                className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5 mb-3">
                  <div className="h-16 w-16 rounded-xl bg-slate-100 overflow-hidden relative shrink-0 border border-slate-200">
                    <img
                      src={char.imageUrl}
                      alt={char.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{char.name}</h3>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                        {char.badge}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 block mb-1">{char.category}</span>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {char.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">1 cred/sec</span>
                  <Link
                    href={`/studio?character=${encodeURIComponent(char.id)}`}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white px-3 py-1 text-xs font-semibold transition-colors"
                  >
                    <Play className="h-3 w-3" />
                    <span>Launch in Studio</span>
                  </Link>
                </div>
              </div>
            ))}

            {/* Custom Photo Upload Shortcut Card */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-4 hover:border-blue-400 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Upload Any Custom Face</h3>
                    <span className="text-[10px] font-mono text-slate-500">Universal Face Reenactment</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Upload any photo from your computer (portrait, 3D avatar, cartoon) to drive live with your webcam in Studio.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/80 mt-3">
                <Link
                  href="/studio"
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <span>Open Studio Uploader</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* OBS & Live Broadcast Integration Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Tv className="h-4 w-4 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Live Broadcast & OBS Studio Integration
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Send your AI face-swapped video directly into WhatsApp Video Calls, Discord, Zoom, Telegram, or Twitch.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stream URL & Key Controls */}
            <div className="space-y-4">
              {/* Private OBS Browser Source URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Private OBS Browser Source URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={obsUrl}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-800 select-all focus:outline-hidden"
                  />
                  <button
                    onClick={() => copyToClipboard(obsUrl, "url")}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
                  >
                    {copiedObsUrl ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-white" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Add this URL as a Browser Source in OBS Studio with width: <strong>1280</strong>, height:{" "}
                  <strong>720</strong>.
                </p>
              </div>

              {/* Secret Stream Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Secret Stream Key
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={showStreamKey ? "text" : "password"}
                    readOnly
                    value={streamKey}
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-mono text-slate-800 select-all focus:outline-hidden"
                  />
                  <button
                    onClick={() => setShowStreamKey(!showStreamKey)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer"
                    title={showStreamKey ? "Hide key" : "Show key"}
                  >
                    {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(streamKey, "key")}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Pop-Out Stream Window Button */}
              <div className="pt-2">
                <button
                  onClick={popOutObsWindow}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer shadow-xs"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-blue-600" />
                  <span>Open 1080p Pop-Out Stream Window</span>
                </button>
              </div>
            </div>

            {/* 4-Step Visual Workflow Guide */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs text-slate-600">
              <span className="font-bold text-slate-900 block mb-1">
                How to stream to WhatsApp, Discord & Zoom:
              </span>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  1
                </span>
                <div>
                  <strong className="text-slate-800">Copy your OBS Link</strong> above.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  2
                </span>
                <div>
                  <strong className="text-slate-800">Add Browser Source in OBS Studio</strong>: Paste your URL, set 1280x720, and check &ldquo;Shutdown source when not visible&rdquo;.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  3
                </span>
                <div>
                  <strong className="text-slate-800">Click &ldquo;Start Virtual Camera&rdquo;</strong> in OBS (bottom right).
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  4
                </span>
                <div>
                  <strong className="text-slate-800">Select &ldquo;OBS Virtual Camera&rdquo;</strong> in your WhatsApp Desktop, Discord, or Zoom camera settings!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Packs Quick Top-Up Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Credit Pack Top-Ups
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Purchase credits securely with Flutterwave. Credits never expire and only burn while your camera is live.
              </p>
            </div>
            <Link
              href="/pricing"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Full Pricing Details</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PRICING_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`rounded-2xl p-6 border flex flex-col justify-between transition-all ${
                  pack.popular
                    ? "border-blue-500 bg-blue-50/20 shadow-xs ring-1 ring-blue-500"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">{pack.name}</h3>
                    {pack.popular && (
                      <span className="text-[10px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 mb-1">
                    ₦{pack.priceNgn.toLocaleString()}
                    <span className="text-xs font-normal text-slate-500 ml-1">(${pack.priceUsd})</span>
                  </div>
                  <div className="text-xs font-bold text-blue-600 mb-3">
                    +{pack.credits.toLocaleString()} Credits · ~{pack.minutesApprox} min
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {pack.features[0]}
                  </p>
                </div>

                <button
                  onClick={() => openTopUpWithPack(pack.id)}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-xs ${
                    pack.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  Purchase {pack.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions & Billing Log */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="h-4 w-4 text-blue-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Recent Billing & Transaction History
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Track credit top-ups, bonus awards, and stream session consumption.
              </p>
            </div>
            <Link
              href="/settings"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Manage Account</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loadingTxns ? (
            <div className="py-10 text-center text-xs text-slate-400">Loading billing history...</div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
              No transactions recorded yet. Top up your wallet to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-mono text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold">Description</th>
                    <th className="py-2.5 px-4 font-semibold">Reference</th>
                    <th className="py-2.5 px-4 font-semibold">Amount</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.slice(0, 5).map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {txn.packName}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {txn.flwTxRef || txn.id.slice(0, 10)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        +{txn.creditsAdded.toLocaleString()} credits
                        <span className="text-[10px] font-normal text-slate-500 block">
                          {txn.currency === "NGN" ? "₦" : "$"}{txn.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            txn.status === "succeeded"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : txn.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {txn.status === "succeeded" ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : null}
                          <span className="capitalize">{txn.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Flutterwave Top-Up Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        initialPackId={selectedPackId}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={(newBal) => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, creditBalance: newBal });
          }
          fetchTransactions();
        }}
      />
    </div>
  );
}
