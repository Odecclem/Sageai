import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transactionStore } from "@/lib/transactionStore";
import { userStore } from "@/lib/userStore";
import { reconcileUserPendingTransactions } from "@/lib/paymentReconciliation";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  // Fast check: automatically reconcile if user has any pending transactions
  const userTxns = transactionStore.getByUserId(user.id);
  const hasPending = userTxns.some((t) => t.status === "pending" && t.paymentProvider === "korapay");

  let activeUser = user;
  if (hasPending) {
    try {
      await reconcileUserPendingTransactions(user.id);
      const refreshed = userStore.getSafeUserById(user.id);
      if (refreshed) activeUser = refreshed;
    } catch (e) {
      console.error("[auth/me reconcile error]:", e);
    }
  }

  return NextResponse.json({
    authenticated: true,
    user: activeUser,
    burnRatePerSecond: 1,
    creditsPerMinute: 60,
    remainingSeconds: activeUser.creditBalance,
    estimatedMinutesRemaining: Number((activeUser.creditBalance / 60).toFixed(1)),
  });
}
