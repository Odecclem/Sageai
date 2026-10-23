import { NextResponse } from "next/server";
import { FLW_SECRET_HASH, verifyTransaction, isFlutterwaveConfigured } from "@/lib/flutterwave";
import { userStore } from "@/lib/userStore";
import { sessionStore } from "@/lib/sessionStore";
import { transactionStore } from "@/lib/transactionStore";

/**
 * POST /api/billing/webhook
 *
 * Flutterwave sends webhook events here when payment status changes.
 * This is the fallback safety net — if the user's browser redirect
 * fails (e.g., they close the tab), the webhook still credits them.
 *
 * Set this URL in Flutterwave Dashboard → Settings → Webhooks.
 * Also set the Secret Hash there and store it as FLW_SECRET_HASH in .env.local.
 */
export async function POST(req: Request) {
  // 1. Verify webhook authenticity using the verif-hash header
  const signature = req.headers.get("verif-hash");
  if (!FLW_SECRET_HASH || !signature || signature !== FLW_SECRET_HASH) {
    console.warn("[Flutterwave Webhook] Invalid or missing verif-hash");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFlutterwaveConfigured) {
    return NextResponse.json({ error: "Flutterwave not configured" }, { status: 400 });
  }

  try {
    const event = await req.json();

    // 2. Only process successful charge events
    if (event.event === "charge.completed" && event.data?.status === "successful") {
      const flwTxId = String(event.data.id);
      const txRef = event.data.tx_ref;

      // 3. Double-verify with Flutterwave's API (never trust webhook payload alone)
      const verification = await verifyTransaction(flwTxId);
      const txData = verification.data;

      if (verification.status !== "success" || txData.status !== "successful") {
        console.warn(`[Flutterwave Webhook] Verification failed for txId=${flwTxId}`);
        return NextResponse.json({ received: true });
      }

      // 4. Find the pending transaction by tx_ref
      const pendingTxn = txRef ? transactionStore.getByFlwTxRef(txRef) : null;

      if (!pendingTxn) {
        console.warn(`[Flutterwave Webhook] No pending transaction for tx_ref=${txRef}`);
        return NextResponse.json({ received: true });
      }

      // 5. Idempotency check — skip if already succeeded
      if (pendingTxn.status === "succeeded") {
        console.log(`[Flutterwave Webhook] Transaction ${pendingTxn.id} already fulfilled, skipping`);
        return NextResponse.json({ received: true });
      }

      // 6. Validate amount and currency
      if (
        Number(txData.amount) >= pendingTxn.amount &&
        txData.currency === pendingTxn.currency
      ) {
        // Credit the user
        userStore.updateCredits(pendingTxn.userId, pendingTxn.creditsAdded);
        sessionStore.addCredits(pendingTxn.creditsAdded, pendingTxn.userId);

        // Mark as succeeded
        transactionStore.updateStatus(pendingTxn.id, "succeeded", {
          flwTransactionId: flwTxId,
        });

        console.log(
          `[Flutterwave Webhook] Credited ${pendingTxn.creditsAdded} credits to user ${pendingTxn.userId}`
        );
      } else {
        console.error(
          `[Flutterwave Webhook] Amount/currency mismatch. Expected ${pendingTxn.currency} ${pendingTxn.amount}, got ${txData.currency} ${txData.amount}`
        );
        transactionStore.updateStatus(pendingTxn.id, "failed", {
          flwTransactionId: flwTxId,
        });
      }
    }

    // Always respond 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Flutterwave Webhook] Error:", err);
    return NextResponse.json({ received: true });
  }
}
