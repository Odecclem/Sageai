import { NextResponse } from "next/server";
import {
  verifyWebhookSignature as verifyKoraSignature,
  verifyTransaction as verifyKoraTransaction,
  isKorapayConfigured,
} from "@/lib/korapay";
import {
  FLW_SECRET_HASH,
  verifyTransaction as verifyFlwTransaction,
  isFlutterwaveConfigured,
} from "@/lib/flutterwave";
import { userStore } from "@/lib/userStore";
import { sessionStore } from "@/lib/sessionStore";
import { transactionStore } from "@/lib/transactionStore";

/**
 * POST /api/billing/webhook
 *
 * Handles asynchronous payment completion notifications from Korapay and Flutterwave.
 * This guarantees order fulfillment even if a user closes their browser before redirect.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const koraSig = req.headers.get("x-korapay-signature");
    const flwSig = req.headers.get("verif-hash");

    // -------------------------------------------------------------------------
    // 1. KORAPAY WEBHOOK NOTIFICATION
    // -------------------------------------------------------------------------
    if (koraSig && isKorapayConfigured) {
      const isValid = verifyKoraSignature(koraSig, rawBody);
      if (!isValid) {
        console.warn("[Korapay Webhook] Invalid HMAC signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      const payload = JSON.parse(rawBody);
      const event = payload.event;
      const data = payload.data;

      if ((event === "charge.success" || data?.status === "success") && data?.reference) {
        const reference = data.reference;

        // Double check directly with Korapay verification endpoint
        const verification = await verifyKoraTransaction(reference);
        const koraData = verification.data;

        if (verification.status && koraData?.status === "success") {
          const pendingTxn = transactionStore.getByReference(reference);

          if (pendingTxn && pendingTxn.status !== "succeeded") {
            if (
              Number(koraData.amount) >= pendingTxn.amount &&
              koraData.currency === pendingTxn.currency
            ) {
              userStore.updateCredits(pendingTxn.userId, pendingTxn.creditsAdded);
              sessionStore.addCredits(pendingTxn.creditsAdded, pendingTxn.userId);
              transactionStore.updateStatus(pendingTxn.id, "succeeded", {
                koraReference: reference,
              });

              console.log(
                `[Korapay Webhook] Fulfilled +${pendingTxn.creditsAdded} credits to ${pendingTxn.userId} (Ref: ${reference})`
              );
            }
          }
        }
      }

      return NextResponse.json({ received: true });
    }

    // -------------------------------------------------------------------------
    // 2. FLUTTERWAVE WEBHOOK NOTIFICATION
    // -------------------------------------------------------------------------
    if (flwSig && isFlutterwaveConfigured && FLW_SECRET_HASH && flwSig === FLW_SECRET_HASH) {
      const event = JSON.parse(rawBody);

      if (event.event === "charge.completed" && event.data?.status === "successful") {
        const flwTxId = String(event.data.id);
        const txRef = event.data.tx_ref;

        const verification = await verifyFlwTransaction(flwTxId);
        const txData = verification.data;

        if (verification.status === "success" && txData?.status === "successful") {
          const pendingTxn = txRef ? transactionStore.getByReference(txRef) : null;

          if (pendingTxn && pendingTxn.status !== "succeeded") {
            if (
              Number(txData.amount) >= pendingTxn.amount &&
              txData.currency === pendingTxn.currency
            ) {
              userStore.updateCredits(pendingTxn.userId, pendingTxn.creditsAdded);
              sessionStore.addCredits(pendingTxn.creditsAdded, pendingTxn.userId);
              transactionStore.updateStatus(pendingTxn.id, "succeeded", {
                flwTransactionId: flwTxId,
              });
            }
          }
        }
      }

      return NextResponse.json({ received: true });
    }

    // Neither signature matched
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Billing Webhook] Error:", err);
    return NextResponse.json({ received: true });
  }
}
