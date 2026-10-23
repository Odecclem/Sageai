import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { transactionStore } from "@/lib/transactionStore";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    // If user is admin and specifies a target, or wants all
    if (user.role === "admin" && targetUserId === "all") {
      const allTxns = transactionStore.getAll();
      const metrics = transactionStore.getMetrics();
      return NextResponse.json({ transactions: allTxns, metrics });
    }

    const txns = transactionStore.getByUserId(targetUserId && user.role === "admin" ? targetUserId : user.id);
    return NextResponse.json({ transactions: txns });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
