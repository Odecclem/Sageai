import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { authenticated: false, user: null, error: "Not authenticated" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user,
    burnRatePerSecond: 1,
    creditsPerMinute: 60,
    remainingSeconds: user.creditBalance,
    estimatedMinutesRemaining: Number((user.creditBalance / 60).toFixed(1)),
  });
}
