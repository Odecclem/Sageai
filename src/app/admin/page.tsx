"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Key,
  Users,
  Radio,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Coins,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  EyeOff,
  Video,
  LogOut,
  ExternalLink,
  Lock,
  Search,
  X,
  UserPlus,
  Receipt,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { SafeUser } from "@/lib/userStore";
import { StreamSession } from "@/lib/sessionStore";
import { Transaction } from "@/lib/transactionStore";
import { BrandLogo } from "@/components/BrandLogo";

interface AdminStats {
  totalUsers: number;
  totalCredits: number;
  totalStreamSeconds: number;
  activeUsers: number;
  adminCount: number;
  activeStreamsCount: number;
  revenue?: {
    totalGrossRevenue: number;
    totalOrders: number;
    totalCreditsIssued: number;
    revenue24h: number;
    averageOrderValue: number;
  };
  xmax: {
    configured: boolean;
    valid: boolean;
    remainingCredits: number | null;
    maskedKey: string;
    actualApiKey: string | null;
  };
}

export default function AdminPage() {
  const router = useRouter();

  // Auth & Admin state
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Active Tab: 'keys' | 'users' | 'streams' | 'stats' | 'ledger'
  const [activeTab, setActiveTab] = useState<"keys" | "users" | "streams" | "stats" | "ledger">("keys");

  // Ledger state
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [revenueMetrics, setRevenueMetrics] = useState<{
    totalGrossRevenue: number;
    totalOrders: number;
    totalCreditsIssued: number;
    revenue24h: number;
    averageOrderValue: number;
  } | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [activeStreams, setActiveStreams] = useState<StreamSession[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // XMax Key Management
  const [newKeyInput, setNewKeyInput] = useState("");
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyMessage, setKeyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // User Filter & Management Modals
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
    initialCredits: 0,
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Add credits modal
  const [selectedUserForCredit, setSelectedUserForCredit] = useState<SafeUser | null>(null);
  const [creditAdjustmentAmount, setCreditAdjustmentAmount] = useState<number>(1000);
  const [adjustingCredits, setAdjustingCredits] = useState(false);

  // Initial Auth Check
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setIsAdmin(data.user.role === "admin");
        } else {
          setCurrentUser(null);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setAuthChecked(true);
      }
    }
    checkAuth();
  }, []);

  // Fetch Admin Stats
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch Streams
  const fetchStreams = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/streams");
      const data = await res.json();
      if (data.success) {
        setActiveStreams(data.activeStreams || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch Ledger & Transactions
  const fetchLedger = useCallback(async () => {
    setLoadingLedger(true);
    try {
      const res = await fetch("/api/admin/ledger");
      const data = await res.json();
      if (data.success) {
        setAllTransactions(data.transactions || []);
        if (data.revenue) {
          setRevenueMetrics(data.revenue);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLedger(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
      fetchStreams();
      fetchLedger();
      const interval = setInterval(() => {
        fetchStreams();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, fetchStats, fetchUsers, fetchStreams, fetchLedger]);

  // Quick 1-click admin login for gate screen
  const loginAsAdmin = async () => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@sage.ai", password: "admin123" }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setIsAdmin(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  // Save new XMax API key
  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyInput.trim()) return;

    setSavingKey(true);
    setKeyMessage(null);

    try {
      const res = await fetch("/api/xmax/save-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newKeyInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to verify or save key with XMax platform");
      }

      setKeyMessage({
        type: "success",
        text: `Key verified successfully! Remaining XMax Balance: ${
          data.remainingCredits !== null ? data.remainingCredits : "Active"
        }`,
      });
      setNewKeyInput("");
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving key";
      setKeyMessage({ type: "error", text: msg });
    } finally {
      setSavingKey(false);
    }
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setCreateUserError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create user");
      }

      setShowCreateUserModal(false);
      setNewUserForm({
        name: "",
        email: "",
        password: "",
        role: "user",
        initialCredits: 0,
      });
      fetchUsers();
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create user";
      setCreateUserError(msg);
    } finally {
      setCreatingUser(false);
    }
  };

  // Adjust User Credits
  const handleAdjustCredits = async (amount: number) => {
    if (!selectedUserForCredit) return;
    setAdjustingCredits(true);

    try {
      const res = await fetch("/api/admin/users/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserForCredit.id,
          amount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to adjust credits");
      }

      setSelectedUserForCredit(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("Failed to adjust credits");
    } finally {
      setAdjustingCredits(false);
    }
  };

  // Toggle Admin Role
  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/users/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
      } else {
        alert(data.error || "Failed to change user role");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete User
  const handleDeleteUser = async (user: SafeUser) => {
    if (!confirm(`Permanently delete account for "${user.name}" (${user.email})?`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
      } else {
        alert(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Terminate Live Stream
  const handleTerminateStream = async (streamKey: string) => {
    if (!confirm(`Force disconnect stream "${streamKey}"?`)) return;

    try {
      const res = await fetch("/api/admin/streams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamKey }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStreams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  // Guard: If not admin, show access gate
  if (authChecked && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 relative selection:bg-blue-600/10">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative z-10 text-center">
          <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4 text-blue-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Admin Access Required</h1>
          <p className="text-sm text-slate-500 mb-6">
            You must be signed in with an administrator account to access the Sage AI Platform Control Center.
          </p>

          <div className="space-y-2.5">
            <Link
              href="/admin/login"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Key className="h-4 w-4" />
              <span>Go to Admin Login Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <button
              onClick={loginAsAdmin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>1-Click Sign In as Master Admin</span>
            </button>

            <Link
              href="/login"
              className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Return to Creator Login</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600/10">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo size="sm" badgeText="ADMIN PORTAL" />

          {/* Upstream Status Pill */}
          <div className="hidden md:flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                stats?.xmax.valid ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className="text-slate-600 font-mono text-[11px]">
              XMax Engine: {stats?.xmax.valid ? "Connected (x2.0 RTC)" : "Needs API Key"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition-all"
          >
            <Video className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Open Creator Studio</span>
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">{currentUser?.name || "Administrator"}</div>
              <div className="text-[10px] text-blue-600 font-mono">{currentUser?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("keys")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "keys"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Key className="h-4 w-4 text-blue-600" />
              <span>System API Keys</span>
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Users className="h-4 w-4 text-blue-600" />
              <span>User Accounts ({users.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("streams")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                activeTab === "streams"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Radio className="h-4 w-4 text-blue-600" />
              <span>Live Streams</span>
              {activeStreams.length > 0 && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
              )}
            </button>

            <button
              onClick={() => setActiveTab("stats")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "stats"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span>Overview & Metrics</span>
            </button>

            <button
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Coins className="h-4 w-4 text-blue-600" />
              <span>Revenue & Orders ({allTransactions.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchStats();
                fetchUsers();
                fetchStreams();
                fetchLedger();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingStats || loadingUsers || loadingLedger ? "animate-spin text-blue-600" : "text-slate-500"}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ================= TAB 1: SYSTEM API KEYS ================= */}
        {activeTab === "keys" && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3.5">
              <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-900 block font-semibold mb-1">
                  Centralized Platform API Key Architecture
                </strong>
                Sage AI operates with centralized master keys managed exclusively by administrators. When creators use
                the Studio, the platform automatically powers their WebRTC character swaps and video engines using your
                configured system key. Regular users never have to add, buy, or expose API keys.
              </div>
            </div>

            {/* Current Active Key Status Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    Master XMax AI Video Engine Key
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Powers character replacement and real-time avatar swaps via WebRTC (<code className="text-slate-700 font-mono">@xmaxai/sdk-global</code>)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {stats?.xmax.valid ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Live & Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Unverified / Key Missing
                    </span>
                  )}
                </div>
              </div>

              {/* Grid: Key details & credits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    Configured API Key
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-mono text-slate-900 truncate">
                      {showKeySecret
                        ? stats?.xmax.actualApiKey || "None"
                        : stats?.xmax.maskedKey || "Not set"}
                    </span>
                    {stats?.xmax.actualApiKey && (
                      <button
                        type="button"
                        onClick={() => setShowKeySecret(!showKeySecret)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
                      >
                        {showKeySecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    XMax Platform Balance
                  </div>
                  <div className="text-lg font-bold font-mono text-blue-600 flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-blue-600" />
                    {stats?.xmax.remainingCredits !== null
                      ? stats?.xmax.remainingCredits?.toLocaleString()
                      : "Active"}
                    <span className="text-xs text-slate-500 font-sans font-normal">credits</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    RTC Model & Endpoint
                  </div>
                  <div className="text-sm font-mono text-slate-800">
                    models.realtime(&apos;x2.0&apos;)
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Region: Global (api.xmax.ai)
                  </div>
                </div>
              </div>

              {/* Form: Replace/Add Master API Key */}
              <form onSubmit={handleSaveKey} className="space-y-4 pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Add / Update Master XMax API Key
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="password"
                    value={newKeyInput}
                    onChange={(e) => setNewKeyInput(e.target.value)}
                    placeholder="Enter your Xmax API key (e.g. sk-live-...)"
                    className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={savingKey || !newKeyInput.trim()}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {savingKey ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Verify & Save Key</span>
                      </>
                    )}
                  </button>
                </div>

                {keyMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      keyMessage.type === "success"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-rose-50 border border-rose-200 text-rose-800"
                    }`}
                  >
                    {keyMessage.type === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <span>{keyMessage.text}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                  <span>Need an API key or more platform credits?</span>
                  <a
                    href="https://platform.xmax.ai/docs/quick-start"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 underline underline-offset-2"
                  >
                    XMax Platform Docs
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 2: USER ACCOUNTS ================= */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Search and Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                />
              </div>

              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create New User</span>
              </button>
            </div>

            {/* Users Table Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-mono tracking-wider text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Credit Balance</th>
                      <th className="py-3 px-4">Time Streamed</th>
                      <th className="py-3 px-4">Created</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isSelf = currentUser?.id === user.id;
                        const minutesStreamed = (user.totalSecondsStreamed / 60).toFixed(1);

                        return (
                          <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* User Name & Email */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs uppercase shrink-0">
                                  {user.name.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                    <span>{user.name}</span>
                                    {isSelf && (
                                      <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded border border-blue-200 font-medium">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                  user.role === "admin"
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>

                            {/* Credit Balance */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-blue-600">
                                  {user.creditBalance.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  (~{(user.creditBalance / 60).toFixed(0)}m)
                                </span>
                              </div>
                            </td>

                            {/* Time Streamed */}
                            <td className="py-3.5 px-4 font-mono text-slate-700">
                              {minutesStreamed} min
                            </td>

                            {/* Created */}
                            <td className="py-3.5 px-4 text-slate-500 text-[11px] font-mono">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Credit Top-Up */}
                                <button
                                  onClick={() => setSelectedUserForCredit(user)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 transition-all text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                                  title="Add/Adjust Credits"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Credits</span>
                                </button>

                                {/* Toggle Role */}
                                {!isSelf && (
                                  <button
                                    onClick={() => handleToggleRole(user.id, user.role)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all text-[11px] font-medium cursor-pointer"
                                    title={user.role === "admin" ? "Demote to Creator" : "Promote to Admin"}
                                  >
                                    {user.role === "admin" ? "Demote" : "Make Admin"}
                                  </button>
                                )}

                                {/* Delete */}
                                {!isSelf && (
                                  <button
                                    onClick={() => handleDeleteUser(user)}
                                    className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                                    title="Delete User"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: LIVE STREAM MONITOR ================= */}
        {activeTab === "streams" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Radio className="h-4 w-4 text-rose-500 animate-pulse" />
                  Active Live Streams
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Monitor active WebRTC video sessions across the platform in real-time.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                Active Broadcasts: <strong className="text-slate-900">{activeStreams.length}</strong>
              </div>
            </div>

            {activeStreams.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Video className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">No Creators Currently Broadcasting</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When a streamer turns on their webcam and begins swapping, their active feed, duration, and
                  credit burn rate will appear here immediately.
                </p>
                <Link
                  href="/studio"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all mt-2"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Launch Studio to Test Stream</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeStreams.map((session) => (
                  <div
                    key={session.streamKey}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="font-mono font-bold text-xs text-slate-900 uppercase">
                          {session.streamKey}
                        </span>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 uppercase font-mono">
                        {session.personaId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-mono">CREATOR</div>
                        <div className="font-semibold text-slate-900 truncate">{session.userName || "Alex Streamer"}</div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-mono">BURN RATE</div>
                        <div className="font-mono text-amber-600 font-medium">1 credit/sec</div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-mono">SESSION DURATION</div>
                        <div className="font-mono text-slate-700">{session.secondsElapsed}s</div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-mono">CREDITS BURNED</div>
                        <div className="font-mono text-blue-600 font-bold">
                          {session.creditsSpentThisSession}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <a
                        href={`/obs?key=${session.streamKey}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono underline"
                      >
                        <span>Inspect OBS Output</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>

                      <button
                        onClick={() => handleTerminateStream(session.streamKey)}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-all cursor-pointer"
                      >
                        Force Terminate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: METRICS & OVERVIEW ================= */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-slate-500 text-xs font-mono uppercase">Total Registered Users</div>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {stats?.totalUsers ?? users.length}
                </div>
                <div className="text-[11px] text-blue-600 font-medium">{stats?.adminCount || 1} Platform Admins</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-slate-500 text-xs font-mono uppercase">Total Credits in Wallets</div>
                <div className="text-2xl font-bold font-mono text-blue-600">
                  {stats?.totalCredits?.toLocaleString() ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  ~{(((stats?.totalCredits ?? 0) / 60)).toFixed(0)} streaming minutes
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-slate-500 text-xs font-mono uppercase">Platform Stream Time</div>
                <div className="text-2xl font-bold font-mono text-emerald-600">
                  {(((stats?.totalStreamSeconds ?? 0) / 60)).toFixed(1)}m
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {stats?.totalStreamSeconds ?? 0} total seconds
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-slate-500 text-xs font-mono uppercase">XMax Cloud Upstream</div>
                <div className="text-2xl font-bold font-mono text-indigo-600">
                  {stats?.xmax.remainingCredits !== null
                    ? stats?.xmax.remainingCredits?.toLocaleString()
                    : "Ready"}
                </div>
                <div className="text-[11px] text-emerald-600 font-mono font-medium">x2.0 Realtime Model</div>
              </div>
            </div>

            {/* Architecture Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                System Infrastructure & Endpoints
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800">OBS Browser Source Endpoint</div>
                  <div className="font-mono text-blue-600 bg-white p-2.5 rounded-lg border border-slate-200 truncate">
                    http://localhost:3000/obs?key=[STREAM_KEY]
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Transparent, clean 60 FPS output synchronized with low latency across browser tabs.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800">Realtime Credit Metering</div>
                  <div className="font-mono text-amber-700 bg-white p-2.5 rounded-lg border border-slate-200 font-medium">
                    1 Credit / Second (60 Credits / Minute)
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Automatic stream freeze and notification when credit balance reaches zero.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: REVENUE & TRANSACTIONS LEDGER ================= */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-blue-600" />
                  Financial Ledger & Customer Orders
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Complete audit trail of all credit package purchases, Flutterwave transactions, and revenue metrics.
                </p>
              </div>

              <button
                onClick={fetchLedger}
                disabled={loadingLedger}
                className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-all cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingLedger ? "animate-spin text-blue-600" : "text-slate-500"}`} />
                <span>Sync Transactions</span>
              </button>
            </div>

            {/* Financial Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-slate-500 text-xs font-mono uppercase flex items-center justify-between">
                  <span>Gross Revenue</span>
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-3xl font-extrabold font-mono text-emerald-600">
                  ${(revenueMetrics?.totalGrossRevenue ?? stats?.revenue?.totalGrossRevenue ?? 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-500">All-time settled volume</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-slate-500 text-xs font-mono uppercase flex items-center justify-between">
                  <span>24h Revenue</span>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-3xl font-extrabold font-mono text-slate-900">
                  ${(revenueMetrics?.revenue24h ?? stats?.revenue?.revenue24h ?? 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-blue-600 font-medium">Past 24 hours</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-slate-500 text-xs font-mono uppercase flex items-center justify-between">
                  <span>Total Orders</span>
                  <Receipt className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-3xl font-extrabold font-mono text-indigo-600">
                  {revenueMetrics?.totalOrders ?? stats?.revenue?.totalOrders ?? allTransactions.length}
                </div>
                <div className="text-[11px] text-slate-500">Paid credit top-ups</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <div className="text-slate-500 text-xs font-mono uppercase flex items-center justify-between">
                  <span>Avg Order Value</span>
                  <Coins className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-3xl font-extrabold font-mono text-blue-600">
                  ${(revenueMetrics?.averageOrderValue ?? stats?.revenue?.averageOrderValue ?? 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-500">USD per transaction</div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  All Transactions ({allTransactions.length})
                </h4>
              </div>

              {allTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No customer transactions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                        <th className="pb-3 font-semibold">Transaction ID</th>
                        <th className="pb-3 font-semibold">Customer</th>
                        <th className="pb-3 font-semibold">Pack Name</th>
                        <th className="pb-3 font-semibold">Amount</th>
                        <th className="pb-3 font-semibold">Credits Issued</th>
                        <th className="pb-3 font-semibold">Provider</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 font-mono text-blue-600 select-all">{txn.id}</td>
                          <td className="py-3">
                            <div className="font-medium text-slate-900">{txn.userName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{txn.userEmail}</div>
                          </td>
                          <td className="py-3 text-slate-700 font-medium">{txn.packName}</td>
                          <td className="py-3 font-mono font-bold text-emerald-600">
                            {txn.currency === "NGN"
                              ? `₦${txn.amount.toLocaleString()} NGN`
                              : `$${txn.amount.toFixed(2)} USD`}
                          </td>
                          <td className="py-3 font-mono text-blue-600 font-semibold">
                            +{txn.creditsAdded.toLocaleString()}
                          </td>
                          <td className="py-3">
                            <span className="uppercase text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                              {txn.paymentProvider}
                            </span>
                          </td>
                          <td className="py-3 text-slate-500 font-mono text-[11px]">
                            {new Date(txn.createdAt).toLocaleDateString()}{" "}
                            {new Date(txn.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                txn.status === "succeeded"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : txn.status === "pending"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {txn.status === "succeeded" && <CheckCircle2 className="h-3 w-3" />}
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
          </div>
        )}
      </main>

      {/* ================= MODAL: CREATE NEW USER ================= */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-blue-600" />
                Create New User Account
              </h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createUserError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {createUserError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Jordan Streamer"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="jordan@streamer.tv"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as "user" | "admin" })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="user">Creator (User)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Starting Credits</label>
                  <input
                    type="number"
                    value={newUserForm.initialCredits}
                    onChange={(e) => setNewUserForm({ ...newUserForm, initialCredits: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {creatingUser ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADJUST USER CREDITS ================= */}
      {selectedUserForCredit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Coins className="h-4 w-4 text-blue-600" />
                Add Credits to User
              </h3>
              <button
                onClick={() => setSelectedUserForCredit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-slate-700">
              User: <strong className="text-slate-900">{selectedUserForCredit.name}</strong>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Current Balance: {selectedUserForCredit.creditBalance.toLocaleString()} credits
              </div>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCreditAdjustmentAmount(amt)}
                  className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    creditAdjustmentAmount === amt
                      ? "bg-blue-50 border-blue-600 text-blue-700"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-600 uppercase mb-1">
                Custom Credit Amount
              </label>
              <input
                type="number"
                value={creditAdjustmentAmount}
                onChange={(e) => setCreditAdjustmentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUserForCredit(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={adjustingCredits || creditAdjustmentAmount === 0}
                onClick={() => handleAdjustCredits(creditAdjustmentAmount)}
                className="px-4 py-2 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                {adjustingCredits ? "Adding..." : `Grant +${creditAdjustmentAmount.toLocaleString()} Credits`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
