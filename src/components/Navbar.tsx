"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Video,
  CreditCard,
  Plus,
  Sparkles,
  Menu,
  X,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  Copy,
  Check,
  Radio,
  Flame,
  Receipt,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { Transaction } from "@/lib/transactionStore";

interface NavbarProps {
  onOpenTopUp?: () => void;
}

export function Navbar({ onOpenTopUp }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
    creditBalance: number;
  } | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [copiedObs, setCopiedObs] = useState(false);
  const [originUrl, setOriginUrl] = useState("");

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        setBalance(data.user.creditBalance);
      } else {
        setUser(null);
        setBalance(0);
      }
    } catch {
      setUser(null);
      setBalance(0);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoadingTxns(true);
      const res = await fetch("/api/billing/history");
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions.slice(0, 3));
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
    fetchUser();
    fetchTransactions();
    const interval = setInterval(() => {
      fetchUser();
      fetchTransactions();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchUser, fetchTransactions]);

  // Synchronize layout shift with document class when user logs in/out
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (user) {
        document.documentElement.classList.add("has-user-sidebar");
      } else {
        document.documentElement.classList.remove("has-user-sidebar");
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("has-user-sidebar");
      }
    };
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("has-user-sidebar");
      }
      setUser(null);
      setBalance(0);
      router.push("/login");
      router.refresh();
    } catch {
      // Ignore
    }
  };

  const streamKey = user ? `sage_${user.id.replace("usr_", "")}_live` : "sage_live";
  const obsUrl = `${originUrl}/obs?key=${streamKey}`;

  const copyObsUrl = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(obsUrl);
      setCopiedObs(true);
      setTimeout(() => setCopiedObs(false), 2000);
    }
  };

  // Nav links available to logged in creators
  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/studio", label: "Creator Studio", icon: Video },
    { href: "/pricing", label: "Credit Packs", icon: CreditCard },
    { href: "/settings", label: "Stream Settings", icon: Settings },
  ];

  if (user?.role === "admin") {
    navLinks.push({ href: "/admin", label: "Admin Panel", icon: ShieldCheck });
  }

  // ---------------------------------------------------------------------------
  // 1. AUTHENTICATED STATE: RENDER CREATOR SIDEBAR (DESKTOP) + MOBILE HEADER
  // ---------------------------------------------------------------------------
  if (user) {
    return (
      <>
        {/* Mobile Top Bar (Visible only on < lg screens) */}
        <header className="lg:hidden sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center justify-between">
          <BrandLogo size="sm" badgeText="Creator" />

          <div className="flex items-center gap-2">
            {/* Wallet Pill on Mobile Header */}
            <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="font-bold text-slate-900 tabular-nums">{balance.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500">cr</span>
              <button
                onClick={onOpenTopUp}
                className="ml-1 rounded-full bg-blue-600 text-white p-0.5 hover:bg-blue-700 cursor-pointer"
                title="Top up credits"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Mobile Slide-Over Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-out Panel */}
            <aside className="relative flex-1 w-full max-w-xs bg-white h-full p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
              <div className="space-y-5">
                {/* Header & Close */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <BrandLogo size="md" badgeText="Creator" />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Credit Wallet Card */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Credit Wallet</span>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-blue-700 font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200">
                      <Flame className="h-3 w-3 text-amber-500" /> 1 cred/sec
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                    {balance.toLocaleString()}
                    <span className="text-xs font-normal text-slate-500 ml-1">credits</span>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenTopUp?.();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Top Up Wallet</span>
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2 mb-1 block">
                    Menu
                  </span>
                  {navLinks.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                      >
                        <link.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Recent Billing & Transaction History in Mobile Drawer */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-800">
                      <Receipt className="h-3.5 w-3.5 text-blue-600" />
                      <span>Recent Billing</span>
                    </span>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                    >
                      <span>View All</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  </div>

                  {loadingTxns ? (
                    <div className="py-2 text-center text-[10px] text-slate-400">Loading history...</div>
                  ) : transactions.length === 0 ? (
                    <div className="py-2 text-center text-[10px] text-slate-400">
                      No top-ups recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {transactions.slice(0, 2).map((txn) => (
                        <div
                          key={txn.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-[11px]"
                        >
                          <div className="min-w-0 pr-1">
                            <div className="font-semibold text-slate-900 truncate text-[11px]">
                              {txn.packName}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              {new Date(txn.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-blue-600 font-mono text-[11px]">
                              +{txn.creditsAdded.toLocaleString()} cr
                            </div>
                            <div className="text-[9px] text-slate-500">
                              {txn.currency === "NGN" ? "₦" : "$"}{txn.amount.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Drawer Actions */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 py-2 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-slate-400 hover:text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* Persistent Desktop Creator Sidebar (lg:flex)                       */}
        {/* ------------------------------------------------------------------- */}
        <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex-col justify-between p-4 shadow-xs select-none overflow-y-auto">
          {/* Top Section */}
          <div className="space-y-4">
            {/* Brand Logo Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <BrandLogo size="md" badgeText="Creator" />
            </div>

            {/* Credit Wallet Widget */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Credit Wallet</span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-blue-700 font-bold bg-white px-2 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                  <Flame className="h-3 w-3 text-amber-500" /> 1 cred/sec
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {balance.toLocaleString()}
                  <span className="text-xs font-normal text-slate-500 ml-1">credits</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  ≈ {Math.floor(balance / 60)}m live
                </span>
              </div>
              <button
                onClick={onOpenTopUp}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Top Up Credits</span>
              </button>
            </div>

            {/* Primary Navigation Links */}
            <nav className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2 mb-1 block">
                Workspace
              </span>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <link.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Recent Billing & Transaction History Widget */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Receipt className="h-3.5 w-3.5 text-blue-600" />
                  <span>Recent Billing</span>
                </span>
                <Link
                  href="/dashboard"
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>

              {loadingTxns ? (
                <div className="py-2 text-center text-[11px] text-slate-400">Loading billing...</div>
              ) : transactions.length === 0 ? (
                <div className="py-2 text-center text-[11px] text-slate-400">
                  No top-ups recorded yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {transactions.slice(0, 2).map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 text-[11px]"
                    >
                      <div className="min-w-0 pr-1.5">
                        <div className="font-semibold text-slate-900 truncate text-[11px]" title={txn.packName}>
                          {txn.packName}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          {new Date(txn.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-blue-600 font-mono text-[11px]">
                          +{txn.creditsAdded.toLocaleString()} cr
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {txn.currency === "NGN" ? "₦" : "$"}{txn.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: OBS Quick Link & Sign Out */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100 mt-2">
            {/* Quick OBS Stream URL Helper */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                  <Radio className="h-3 w-3 text-blue-600" /> OBS Stream Feed
                </span>
                <span className="text-[9px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  1080p 60fps
                </span>
              </div>
              <button
                onClick={copyObsUrl}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 py-1.5 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                {copiedObs ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied OBS Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-slate-400" />
                    <span>Copy OBS Stream URL</span>
                  </>
                )}
              </button>
            </div>

            {/* Neural Engine & Sign Out */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Neural RTC Online</span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out of Creator Account"
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. UNAUTHENTICATED GUEST STATE: RENDER PUBLIC TOP NAVIGATION BAR
  // ---------------------------------------------------------------------------
  const guestLinks = [
    { href: "/pricing", label: "Credit Packs", icon: CreditCard },
    { href: "/studio", label: "Studio Demo", icon: Video },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <BrandLogo size="md" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {guestLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <link.icon className={`h-3.5 w-3.5 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side: Auth Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Sign In</span>
          </Link>

          <Link
            href="/register"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Create Account</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay for guests */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1 shadow-lg">
          {guestLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <link.icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
