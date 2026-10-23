import { NextResponse } from "next/server";
import { verifyTransaction as verifyKoraTransaction, isKorapayConfigured } from "@/lib/korapay";
import { verifyTransaction as verifyFlwTransaction, isFlutterwaveConfigured } from "@/lib/flutterwave";
import { transactionStore } from "@/lib/transactionStore";
import { userStore } from "@/lib/userStore";
import { sessionStore } from "@/lib/sessionStore";

/**
 * GET /api/billing/verify?reference=...&status=...
 *
 * Payment gateways (Korapay / Flutterwave) redirect the customer here
 * after they complete or cancel payment on the hosted checkout page.
 *
 * We verify the transaction cryptographically server-side directly with the gateway
 * before crediting the user's wallet.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference") || searchParams.get("tx_ref");
  const transactionId = searchParams.get("transaction_id");
  const gatewayStatus = searchParams.get("status");

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  // Customer cancelled payment
  if (gatewayStatus === "cancelled" || (!reference && !transactionId)) {
    if (reference) {
      const existing = transactionStore.getByReference(reference);
      if (existing && existing.status === "pending") {
        transactionStore.updateStatus(existing.id, "failed");
      }
    }
    return NextResponse.redirect(`${origin}/pricing?checkout=cancelled`);
  }

  // ---------------------------------------------------------------------------
  // 1. KORAPAY VERIFICATION (Primary)
  // ---------------------------------------------------------------------------
  if (reference && (reference.startsWith("kora_") || isKorapayConfigured)) {
    try {
      const koraRes = await verifyKoraTransaction(reference);
      const koraData = koraRes.data;

      const pendingTxn = transactionStore.getByReference(reference);

      if (koraRes.status && koraData && koraData.status === "success" && pendingTxn) {
        // Prevent duplicate crediting
        if (pendingTxn.status === "succeeded") {
          return NextResponse.redirect(
            `${origin}/dashboard?checkout=success&credits=${pendingTxn.creditsAdded}`
          );
        }

        const expectedAmount = pendingTxn.amount;
        const expectedCurrency = pendingTxn.currency;

        if (
          Number(koraData.amount) >= expectedAmount &&
          koraData.currency === expectedCurrency
        ) {
          // 1. Credit the user's wallet in userStore (and Supabase)
          userStore.updateCredits(pendingTxn.userId, pendingTxn.creditsAdded);
          sessionStore.addCredits(pendingTxn.creditsAdded, pendingTxn.userId);

          // 2. Mark transaction as succeeded
          transactionStore.updateStatus(pendingTxn.id, "succeeded", {
            koraReference: reference,
          });

          console.log(
            `[Korapay Verify] Credited +${pendingTxn.creditsAdded} credits to user ${pendingTxn.userId} (Ref: ${reference})`
          );

          return NextResponse.redirect(
            `${origin}/dashboard?checkout=success&credits=${pendingTxn.creditsAdded}`
          );
        } else {
          console.error(
            `[Korapay Verify] Amount mismatch. Expected ${expectedCurrency} ${expectedAmount}, got ${koraData.currency} ${koraData.amount}`
          );
          transactionStore.updateStatus(pendingTxn.id, "failed");
          return NextResponse.redirect(`${origin}/pricing?checkout=error&reason=amount_mismatch`);
        }
      }

      // Verification indicated pending or failed
      if (pendingTxn && koraData?.status === "failed") {
        transactionStore.updateStatus(pendingTxn.id, "failed");
      }
      return NextResponse.redirect(`${origin}/pricing?checkout=failed`);
    } catch (err) {
      console.error("[Korapay Verify] Error:", err);
      return NextResponse.redirect(`${origin}/pricing?checkout=error`);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. FLUTTERWAVE VERIFICATION (Fallback)
  // ---------------------------------------------------------------------------
  if (isFlutterwaveConfigured && transactionId) {
    try {
      const response = await verifyFlwTransaction(transactionId);
      const txData = response.data;
      const pendingTxn = reference ? transactionStore.getByReference(reference) : null;

      if (response.status === "success" && txData?.status === "successful" && pendingTxn) {
        if (pendingTxn.status === "succeeded") {
          return NextResponse.redirect(
            `${origin}/dashboard?checkout=success&credits=${pendingTxn.creditsAdded}`
          );
        }

        userStore.updateCredits(pendingTxn.userId, pendingTxn.creditsAdded);
        sessionStore.addCredits(pendingTxn.creditsAdded, pendingTxn.userId);
        transactionStore.updateStatus(pendingTxn.id, "succeeded", {
          flwTransactionId: transactionId,
        });

        return NextResponse.redirect(
          `${origin}/dashboard?checkout=success&credits=${pendingTxn.creditsAdded}`
        );
      }
    } catch (err) {
      console.error("[Flutterwave Verify] Error:", err);
    }
  }

  return NextResponse.redirect(`${origin}/pricing?checkout=failed`);
}
