"use client";

import { useState, useEffect, useRef } from "react";
import { PRICING_PACKS, PricingPlan } from "@/lib/store";
import {
  X,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  Loader2,
  ExternalLink,
  RefreshCw,
  Clock,
} from "lucide-react";
import confetti from "canvas-confetti";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
  initialPackId?: string;
}

export function TopUpModal({ isOpen, onClose, onSuccess, initialPackId }: TopUpModalProps) {
  const [selectedPack, setSelectedPack] = useState<PricingPlan>(
    (initialPackId && PRICING_PACKS.find((p) => p.id === initialPackId)) || PRICING_PACKS[1]
  );

  useEffect(() => {
    if (initialPackId) {
      const match = PRICING_PACKS.find((p) => p.id === initialPackId);
      if (match) setSelectedPack(match);
    }
  }, [initialPackId, isOpen]);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Live Payment Awaiting State
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false);
  const [activeReference, setActiveReference] = useState<string | null>(null);
  const [activeCheckoutUrl, setActiveCheckoutUrl] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear polling on unmount or close
  const cleanupPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupPolling();
      setIsAwaitingPayment(false);
      setActiveReference(null);
      setActiveCheckoutUrl(null);
      setSuccessMessage(null);
      setCheckoutError(null);
      setLoading(false);
    }
    return () => cleanupPolling();
  }, [isOpen]);

  const checkPaymentStatus = async (ref: string, silent = false) => {
    if (!silent) setIsCheckingStatus(true);
    try {
      const res = await fetch(`/api/billing/status?reference=${encodeURIComponent(ref)}`);
      const data = await res.json();

      if (data.status === "succeeded") {
        cleanupPolling();
        setIsAwaitingPayment(false);
        setSuccessMessage(`+${data.creditsAdded.toLocaleString()} credits added immediately!`);
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2563eb", "#4f46e5", "#0ea5e9", "#10b981"],
        });

        if (onSuccess && typeof data.currentBalance === "number") {
          onSuccess(data.currentBalance);
        }

        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
        }, 2200);
        return true;
      }
      return false;
    } catch (err) {
      if (!silent) console.error("Error polling payment status:", err);
      return false;
    } finally {
      if (!silent) setIsCheckingStatus(false);
    }
  };

  const handleCheckout = async () => {
    setLoading(true);
    setSuccessMessage(null);
    setCheckoutError(null);

    try {
      // 1. Initiate Checkout session on backend
      const checkoutRes = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: selectedPack.id }),
      });
      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.error || "Failed to start checkout");
      }

      // If Korapay / hosted checkout URL is available:
      if (checkoutData.checkoutUrl && checkoutData.reference) {
        setActiveReference(checkoutData.reference);
        setActiveCheckoutUrl(checkoutData.checkoutUrl);
        setIsAwaitingPayment(true);

        // Try opening in popup window or tab
        const popup = window.open(
          checkoutData.checkoutUrl,
          "_blank",
          "width=520,height=760,menubar=no,toolbar=no,location=no,status=no"
        );

        // Start active background polling every 2.5 seconds
        cleanupPolling();
        pollIntervalRef.current = setInterval(() => {
          checkPaymentStatus(checkoutData.reference, true);
        }, 2500);

        return;
      }

      // Fallback: Sandbox mode fulfillment when live gateway is not configured
      const res = await fetch("/api/billing/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: selectedPack.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`+${data.creditsAdded.toLocaleString()} credits added (Sandbox Verified)!`);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#2563eb", "#4f46e5", "#0ea5e9"],
        });
        if (onSuccess) {
          onSuccess(data.newBalance);
        }
        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
        }, 1800);
      } else {
        throw new Error(data.error || "Failed to add credits");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment failed";
      setCheckoutError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: LIVE AWAITING CONFIRMATION SCREEN                      */}
        {/* ------------------------------------------------------------- */}
        {isAwaitingPayment ? (
          <div>
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200 mb-3">
                <Clock className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
                <span>Awaiting Payment Confirmation</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Korapay Payment in Progress
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Complete your bank transfer or card payment in the Korapay window. Your credits will reflect automatically as soon as payment is confirmed.
              </p>
            </div>

            {/* Live Status Card */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 mb-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-slate-900">{selectedPack.name}</div>
                  <div className="text-xs font-mono text-blue-700 font-semibold">
                    {selectedPack.priceNgn ? `₦${selectedPack.priceNgn.toLocaleString()} NGN` : `$${selectedPack.priceUsd} USD`}
                    <span className="text-slate-500 ml-1 font-normal font-sans">
                      (+{selectedPack.credits.toLocaleString()} credits)
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600">
                Listening for bank transfer or card confirmation in real-time...
              </p>
            </div>

            {/* Error or Success */}
            {successMessage && (
              <div className="w-full mb-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-center text-sm font-semibold border border-emerald-200 flex items-center justify-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={() => activeReference && checkPaymentStatus(activeReference)}
                disabled={isCheckingStatus}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying with Korapay...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>I have completed payment · Verify Now</span>
                  </>
                )}
              </button>

              {activeCheckoutUrl && (
                <button
                  onClick={() => window.open(activeCheckoutUrl, "_blank")}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Re-open Korapay payment window</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Close and check back later
              </button>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* VIEW 2: PACKAGE SELECTION & CHECKOUT INITIALIZATION          */
          /* ------------------------------------------------------------- */
          <div>
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 mb-2">
                <Zap className="h-3 w-3 text-blue-600" />
                <span>Pay As You Stream</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Top Up Stream Credits</h2>
              <p className="text-xs text-slate-500 mt-1">
                Exact 1 credit per second (60 credits/min) while live. Credits never expire and there are zero recurring fees.
              </p>
            </div>

            {/* Packs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {PRICING_PACKS.map((pack) => {
                const isSelected = selectedPack.id === pack.id;
                return (
                  <div
                    key={pack.id}
                    onClick={() => setSelectedPack(pack)}
                    className={`relative flex flex-col justify-between rounded-xl p-4 cursor-pointer transition-all border ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    {pack.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-xs">
                        Popular
                      </span>
                    )}
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{pack.name}</h3>
                      <div className="mt-2 text-xl font-extrabold text-slate-900">
                        {pack.credits.toLocaleString()}
                        <span className="text-[11px] font-normal text-slate-500 block font-mono">credits</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">~{pack.minutesApprox} min live</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-sm font-bold text-slate-900">
                        {pack.priceNgn ? `₦${pack.priceNgn.toLocaleString()}` : `$${pack.priceUsd}`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {pack.priceNgn ? `$${pack.priceUsd} USD` : "USD"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Pack Summary */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 mb-6">
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                <span>Selected Package</span>
                <span className="font-semibold text-slate-900">{selectedPack.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                <span>Stream Time Allowance</span>
                <span className="font-semibold text-blue-600 font-mono">~{selectedPack.minutesApprox} Minutes Live</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2.5 border-t border-slate-200">
                <span>Total Payable</span>
                <div className="text-right">
                  <span className="text-base text-blue-600 font-bold font-mono">
                    {selectedPack.priceNgn ? `₦${selectedPack.priceNgn.toLocaleString()}` : `$${selectedPack.priceUsd} USD`}
                  </span>
                  {selectedPack.priceNgn && (
                    <span className="text-[11px] text-slate-400 block font-normal font-mono">
                      (${selectedPack.priceUsd} USD)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mb-4">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Instant wallet activation · Secured by Korapay</span>
            </div>

            {/* Error message */}
            {checkoutError && (
              <div className="w-full mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium">
                {checkoutError}
              </div>
            )}

            {/* Action Button */}
            {successMessage ? (
              <div className="w-full py-3 rounded-xl bg-emerald-50 text-emerald-700 text-center text-sm font-semibold border border-emerald-200 flex items-center justify-center gap-2">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3.5 text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Preparing Checkout...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Confirm & Add {selectedPack.credits.toLocaleString()} Credits</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
