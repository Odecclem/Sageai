import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transactionStore } from "@/lib/transactionStore";
import { reconcileUserPendingTransactions } from "@/lib/paymentReconciliation";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const queryUserId = targetUserId && user.role === "admin" ? targetUserId : user.id;

    // Fast check: reconcile any pending Korapay transactions for the queried user
    try {
      const userTxns = transactionStore.getByUserId(queryUserId);
      const hasPending = userTxns.some((t) => t.status === "pending" && t.paymentProvider === "korapay");
      if (hasPending) {
        await reconcileUserPendingTransactions(queryUserId);
      }
    } catch (e) {
      console.error("[billing/history reconcile error]:", e);
    }

    // If user is admin and specifies a target, or wants all
    if (user.role === "admin" && targetUserId === "all") {
      const allTxns = transactionStore.getAll();
      const metrics = transactionStore.getMetrics();
      return NextResponse.json({ transactions: allTxns, metrics });
    }

    const txns = transactionStore.getByUserId(queryUserId);
    return NextResponse.json({ transactions: txns });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
