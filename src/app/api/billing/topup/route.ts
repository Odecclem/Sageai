import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sessionStore } from "@/lib/sessionStore";
import { PRICING_PACKS } from "@/lib/store";
import { transactionStore } from "@/lib/transactionStore";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in before topping up your credit wallet" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { packId } = body;

    const pack = PRICING_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: "Invalid pricing package" }, { status: 400 });
    }

    const newBalance = sessionStore.addCredits(pack.credits, user.id);

    // Record verified transaction in ledger
    transactionStore.create({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      packId: pack.id,
      packName: pack.name,
      amount: pack.priceUsd,
      currency: "USD",
      creditsAdded: pack.credits,
      paymentProvider: "sandbox",
      status: "succeeded",
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${pack.credits.toLocaleString()} credits to your account!`,
      creditsAdded: pack.credits,
      newBalance,
      pack,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
