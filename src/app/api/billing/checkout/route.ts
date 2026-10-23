import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PRICING_PACKS } from "@/lib/store";
import { isKorapayConfigured, initiatePayment as initiateKoraPayment } from "@/lib/korapay";
import { isFlutterwaveConfigured, initiatePayment as initiateFlwPayment } from "@/lib/flutterwave";
import { transactionStore } from "@/lib/transactionStore";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to purchase credits." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { packId } = body;

    const pack = PRICING_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: "Invalid pricing package." }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${host}`;

    // 1. KORAPAY GATEWAY (Primary)
    if (isKorapayConfigured) {
      const koraRef = `kora_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const txn = transactionStore.create({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        packId: pack.id,
        packName: pack.name,
        amount: pack.priceNgn || pack.priceUsd,
        currency: pack.priceNgn ? "NGN" : "USD",
        creditsAdded: pack.credits,
        paymentProvider: "korapay",
        status: "pending",
        koraReference: koraRef,
      });

      const { checkoutUrl, reference } = await initiateKoraPayment({
        reference: koraRef,
        amount: pack.priceNgn || pack.priceUsd,
        currency: pack.priceNgn ? "NGN" : "USD",
        redirect_url: `${origin}/api/billing/verify?reference=${koraRef}`,
        notification_url: `${origin}/api/billing/webhook`,
        narration: `${pack.name} - ${pack.credits.toLocaleString()} Streaming Credits`,
        customer: {
          name: user.name,
          email: user.email,
        },
      });

      return NextResponse.json({
        mode: "korapay",
        checkoutUrl,
        reference,
        transactionId: txn.id,
      });
    }

    // 2. FLUTTERWAVE GATEWAY (Secondary Fallback)
    if (isFlutterwaveConfigured) {
      const txRef = `flw_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const txn = transactionStore.create({
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        packId: pack.id,
        packName: pack.name,
        amount: pack.priceNgn || pack.priceUsd,
        currency: pack.priceNgn ? "NGN" : "USD",
        creditsAdded: pack.credits,
        paymentProvider: "flutterwave",
        status: "pending",
        flwTxRef: txRef,
      });

      const { link } = await initiateFlwPayment({
        tx_ref: txRef,
        amount: pack.priceNgn || pack.priceUsd,
        currency: pack.priceNgn ? "NGN" : "USD",
        redirect_url: `${origin}/api/billing/verify?tx_ref=${txRef}`,
        customer: {
          email: user.email,
          name: user.name,
        },
        customizations: {
          title: "Sage AI Studio",
          description: `${pack.name} - ${pack.credits.toLocaleString()} Streaming Credits`,
        },
      });

      return NextResponse.json({
        mode: "flutterwave",
        checkoutUrl: link,
        txRef,
        transactionId: txn.id,
      });
    }

    // 3. SANDBOX DEVELOPMENT MODE (Fallback)
    return NextResponse.json({
      mode: "sandbox",
      pack,
      user,
      message: "Gateway keys not detected. You can test purchases in Sandbox Mode.",
    });
  } catch (err: unknown) {
    console.error("Payment Checkout Error:", err);
    const message = err instanceof Error ? err.message : "Failed to initiate checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
