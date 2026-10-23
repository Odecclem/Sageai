"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { TopUpModal } from "@/components/TopUpModal";
import {
  ShieldCheck,
  Zap,
  Radio,
  Copy,
  Check,
  Eye,
  EyeOff,
  Coins,
  History,
  Lock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock,
  Receipt,
} from "lucide-react";
import { SafeUser } from "@/lib/userStore";
import { Transaction } from "@/lib/transactionStore";

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // Stream key
  const [streamKey, setStreamKey] = useState("sage_live_89d83");
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedObsUrl, setCopiedObsUrl] = useState(false);

  // Billing history
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoadingUser(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        setStreamKey(`sage_${data.user.id.replace("usr_", "")}_live`);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
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
    fetchUser();
    fetchHistory();
  }, [fetchUser, fetchHistory]);

  const copyToClipboard = (text: string, type: "key" | "url") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedObsUrl(true);
      setTimeout(() => setCopiedObsUrl(false), 2000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 6 characters long",
      });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update password");
      }

      setPasswordMessage({
        type: "success",
        text: "Password updated successfully!",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password update failed";
      setPasswordMessage({ type: "error", text: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  const obsBrowserUrl = typeof window !== "undefined" ? `${window.location.origin}/obs` : "/obs";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600/10 selection:text-blue-900">
      <Navbar onOpenTopUp={() => setIsTopUpOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700 mb-2">
              <Zap className="h-3 w-3 text-blue-600" />
              <span>Customer Portal & Wallet</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Account & Creator Settings
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your profile, streaming keys, billing history, and wallet balance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
            >
              <span>Open Creator Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Administrator Mode Banner */}
        {currentUser?.role === "admin" && (
          <div className="mb-8 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Platform Administrator Privileges</h2>
                <p className="text-xs text-slate-600">
                  You are logged in as an administrator. Manage master AI keys, platform user accounts, and view the global financial ledger.
                </p>
              </div>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0"
            >
              <span>Open Admin Dashboard</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Profile, Wallet, and OBS Integration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Overview Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xl font-bold">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "C"}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{currentUser?.name || "Creator"}</h2>
                  <p className="text-xs text-slate-500">{currentUser?.email || "..."}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                      <ShieldCheck className="h-3 w-3" />
                      {currentUser?.role === "admin" ? "Platform Admin" : "Verified Creator"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Account ID:</span>
                  <span className="font-mono text-slate-800">{currentUser?.id || "..."}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Member Since:</span>
                  <span className="text-slate-800">
                    {currentUser?.createdAt
                      ? new Date(currentUser.createdAt).toLocaleDateString()
                      : "October 2026"}
                  </span>
                </div>
              </div>
            </div>

            {/* Wallet & Credits Card */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider">
                  <Coins className="h-4 w-4" />
                  <span>Streaming Wallet</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  Active
                </span>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                  {currentUser?.creditBalance?.toLocaleString() ?? 0}
                  <span className="text-xs font-sans text-blue-600 ml-2 font-semibold">Credits</span>
                </div>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Allows{" "}
                    <strong className="text-slate-900">
                      ~{Math.floor((currentUser?.creditBalance ?? 0) / 60)} minutes
                    </strong>{" "}
                    of live stream transformation
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsTopUpOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Top Up Credit Wallet</span>
              </button>
            </div>

            {/* OBS Studio & Video Call Integration Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                <Radio className="h-4 w-4" />
                <span>OBS Stream Integration</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect your live stream directly into OBS Studio, Zoom, Discord, or Telegram.
              </p>

              {/* Stream Key Field */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Personal Stream Key
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-xs">
                  <span className="flex-1 truncate text-slate-800 select-all">
                    {showStreamKey ? streamKey : "••••••••••••••••••••"}
                  </span>
                  <button
                    onClick={() => setShowStreamKey(!showStreamKey)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showStreamKey ? "Hide key" : "Show key"}
                  >
                    {showStreamKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(streamKey, "key")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-[11px] font-semibold cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* OBS Browser Source URL */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  OBS Browser Source URL
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-xs">
                  <span className="flex-1 truncate text-slate-600 select-all">{obsBrowserUrl}</span>
                  <button
                    onClick={() => copyToClipboard(obsBrowserUrl, "url")}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors text-[11px] font-semibold cursor-pointer"
                  >
                    {copiedObsUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedObsUrl ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Billing History & Security */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing History Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Purchase & Billing History</h2>
                </div>
                <button
                  onClick={fetchHistory}
                  disabled={loadingTxns}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingTxns ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingTxns ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading billing history...</div>
              ) : transactions.length === 0 ? (
                <div className="py-10 text-center rounded-xl bg-slate-50 border border-slate-200 p-6">
                  <History className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-slate-900">No purchase history yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    When you purchase credit packs, your invoices and receipts will appear here.
                  </p>
                  <button
                    onClick={() => setIsTopUpOpen(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Top Up Credits
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Package</th>
                        <th className="pb-3 font-semibold">Amount</th>
                        <th className="pb-3 font-semibold">Credits</th>
                        <th className="pb-3 font-semibold">Provider</th>
                        <th className="pb-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 text-slate-600">
                            {new Date(txn.createdAt).toLocaleDateString()}{" "}
                            <span className="text-[10px] text-slate-400">
                              {new Date(txn.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="py-3 font-medium text-slate-900">{txn.packName}</td>
                          <td className="py-3 font-mono font-semibold text-slate-900">
                            {txn.currency === "NGN"
                              ? `₦${txn.amount.toLocaleString()} NGN`
                              : `$${txn.amount.toFixed(2)} USD`}
                          </td>
                          <td className="py-3 font-mono font-semibold text-blue-600">
                            +{txn.creditsAdded.toLocaleString()}
                          </td>
                          <td className="py-3">
                            <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {txn.paymentProvider}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                txn.status === "succeeded"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : txn.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {txn.status === "succeeded" && <Check className="h-3 w-3" />}
                              {txn.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Account Security: Change Password Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Security & Password</h2>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Keep your account secure by using a strong password with letters, numbers, and symbols.
              </p>

              {passwordMessage && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                    passwordMessage.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat new password"
                      className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Top Up Modal */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={(newBal) => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, creditBalance: newBal });
          }
          fetchHistory();
        }}
      />
    </div>
  );
}
