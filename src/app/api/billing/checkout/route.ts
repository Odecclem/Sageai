import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PRICING_PACKS } from "@/lib/store";
import { isFlutterwaveConfigured, initiatePayment } from "@/lib/flutterwave";
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

    // Generate a unique transaction reference
    const txRef = `flw_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (isFlutterwaveConfigured) {
      // 1. Create a pending transaction record
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

      // 2. Initiate Flutterwave Standard hosted checkout
      const { link } = await initiatePayment({
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
          description: `${pack.name} - ${pack.credits.toLocaleString()} Streaming Credits (~${pack.minutesApprox} min live)`,
        },
        meta: {
          userId: user.id,
          packId: pack.id,
          credits: String(pack.credits),
          transactionId: txn.id,
        },
      });

      return NextResponse.json({
        mode: "flutterwave",
        checkoutUrl: link,
        txRef,
        transactionId: txn.id,
      });
    }

    // Fallback: Sandbox / Development Mode when Flutterwave keys are not yet configured
    return NextResponse.json({
      mode: "sandbox",
      pack,
      user,
      message:
        "Flutterwave API keys are not yet configured in .env.local. You can test purchases in Sandbox Mode or configure FLW_PUBLIC_KEY and FLW_SECRET_KEY.",
    });
  } catch (err: unknown) {
    console.error("Flutterwave Checkout Error:", err);
    const message = err instanceof Error ? err.message : "Failed to initiate checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
