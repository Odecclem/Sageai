import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transactionStore } from "@/lib/transactionStore";
import { userStore } from "@/lib/userStore";
import { reconcileTransaction, reconcileUserPendingTransactions } from "@/lib/paymentReconciliation";

/**
 * GET /api/billing/status?reference=...
 *
 * Checks Korapay directly for a transaction reference, fulfills credits immediately
 * if successful, and returns current status and updated user wallet balance.
 */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    // 1. If reference provided, check that specific transaction
    if (reference) {
      const txn = transactionStore.getByReference(reference);
      if (!txn) {
        return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
      }

      const recResult = await reconcileTransaction(txn);
      const refreshedUser = userStore.getUserById(user.id);

      return NextResponse.json({
        success: true,
        reference: txn.koraReference || reference,
        status: recResult.status,
        reconciled: recResult.reconciled,
        creditsAdded: txn.creditsAdded,
        currentBalance: refreshedUser?.creditBalance ?? user.creditBalance,
      });
    }

    // 2. If no reference provided, reconcile all pending for this user
    const summary = await reconcileUserPendingTransactions(user.id);
    const refreshedUser = userStore.getUserById(user.id);
    const txns = transactionStore.getByUserId(user.id);

    return NextResponse.json({
      success: true,
      reconciledCount: summary.reconciledCount,
      creditsAwarded: summary.creditsAwarded,
      currentBalance: refreshedUser?.creditBalance ?? user.creditBalance,
      transactions: txns,
    });
  } catch (err: unknown) {
    console.error("[Billing Status Error]:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
