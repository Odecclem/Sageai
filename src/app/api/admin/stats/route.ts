import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { userStore } from "@/lib/userStore";
import { sessionStore } from "@/lib/sessionStore";
import { transactionStore } from "@/lib/transactionStore";

export async function GET() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const storeStats = userStore.getStats();
  const activeStreams = sessionStore.getActiveSessions();
  const revenueMetrics = transactionStore.getMetrics();

  // Also query XMax platform status
  const apiKey = process.env.XMAX_API_KEY || process.env.NEXT_PUBLIC_XMAX_API_KEY;
  let xmaxInfo = {
    configured: !!apiKey,
    valid: false,
    remainingCredits: null as number | null,
    maskedKey: apiKey ? apiKey.slice(0, 6) + "..." + apiKey.slice(-4) : "Not Configured",
    actualApiKey: apiKey || null,
  };

  if (apiKey) {
    try {
      const balanceRes = await fetch("https://api.xmax.ai/open/api/v1/balance", {
        headers: { "X-Api-Key": apiKey },
      }).catch(() => null);

      if (balanceRes && balanceRes.ok) {
        const bData = await balanceRes.json().catch(() => ({}));
        if (bData.success && bData.data) {
          xmaxInfo.valid = true;
          xmaxInfo.remainingCredits = typeof bData.data.currentBalance === "number" ? bData.data.currentBalance : null;
        }
      }
    } catch {
      // Ignore
    }
  }

  return NextResponse.json({
    success: true,
    stats: {
      ...storeStats,
      activeStreamsCount: activeStreams.length,
      xmax: xmaxInfo,
      revenue: revenueMetrics,
    },
  });
}
