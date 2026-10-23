import { NextResponse } from "next/server";
import { verifyTransaction, isFlutterwaveConfigured } from "@/lib/flutterwave";
import { transactionStore } from "@/lib/transactionStore";
import { userStore } from "@/lib/userStore";
import { sessionStore } from "@/lib/sessionStore";

/**
 * GET /api/billing/verify?transaction_id=...&tx_ref=...&status=...
 *
 * Flutterwave redirects the user here after they complete (or cancel)
 * payment on the hosted checkout page. We verify the transaction
 * server-side before crediting the user's wallet.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transaction_id");
  const txRef = searchParams.get("tx_ref");
  const flwStatus = searchParams.get("status");

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  // User cancelled payment
  if (flwStatus === "cancelled" || !transactionId) {
    // Mark transaction as failed if we have a tx_ref
    if (txRef) {
      const existingTxn = transactionStore.getByFlwTxRef(txRef);
      if (existingTxn && existingTxn.status === "pending") {
        transactionStore.updateStatus(existingTxn.id, "failed");
      }
    }
    return NextResponse.redirect(`${origin}/pricing?checkout=cancelled`);
  }

  if (!isFlutterwaveConfigured) {
    return NextResponse.redirect(`${origin}/pricing?checkout=error&reason=gateway_not_configured`);
  }

  try {
    // Server-side verification with Flutterwave
    const response = await verifyTransaction(transactionId);
    const txData = response.data;

    // Find the pending transaction in our ledger
    const pendingTxn = txRef ? transactionStore.getByFlwTxRef(txRef) : null;

    if (
      response.status === "success" &&
      txData.status === "successful" &&
      pendingTxn
    ) {
      // Validate the amount matches what we expect
      const expectedAmount = pendingTxn.amount;
      const expectedCurrency = pendingTxn.currency;

      if (
        Number(txData.amount) >= expectedAmount &&
        txData.currency === expectedCurrency
      ) {
        // 1. Credit the user's wallet (both userStore and sessionStore)
        userStore.updateCredits(pendingTxn.userId, pendingTxn.creditsAdded);
        sessionStore.addCredits(pendingTxn.creditsAdded, pendingTxn.userId);

        // 2. Mark transaction as succeeded
        transactionStore.updateStatus(pendingTxn.id, "succeeded", {
          flwTransactionId: transactionId,
        });

        console.log(
          `[Flutterwave Verify] Credited ${pendingTxn.creditsAdded} credits to user ${pendingTxn.userId} (txRef: ${txRef})`
        );

        return NextResponse.redirect(
          `${origin}/settings?checkout=success&credits=${pendingTxn.creditsAdded}`
        );
      } else {
        // Amount or currency mismatch — possible tampering
        console.error(
          `[Flutterwave Verify] Amount mismatch. Expected ${expectedCurrency} ${expectedAmount}, got ${txData.currency} ${txData.amount}`
        );
        transactionStore.updateStatus(pendingTxn.id, "failed", {
          flwTransactionId: transactionId,
        });
        return NextResponse.redirect(`${origin}/pricing?checkout=error&reason=amount_mismatch`);
      }
    }

    // Transaction verification failed
    if (pendingTxn) {
      transactionStore.updateStatus(pendingTxn.id, "failed", {
        flwTransactionId: transactionId,
      });
    }
    return NextResponse.redirect(`${origin}/pricing?checkout=failed`);
  } catch (err) {
    console.error("[Flutterwave Verify] Error:", err);
    return NextResponse.redirect(`${origin}/pricing?checkout=error`);
  }
}
