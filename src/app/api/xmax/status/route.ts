import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";

export async function GET() {
  const apiKey = process.env.XMAX_API_KEY || process.env.NEXT_PUBLIC_XMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, error: "System engine key not configured" });
  }

  const isAdmin = await isCurrentUserAdmin();

  try {
    const stsRes = await fetch("https://api.xmax.ai/open/api/v1/cos/sts", {
      headers: { "X-Api-Key": apiKey },
    });

    const data = await stsRes.json().catch(() => ({}));

    if (data.code === 200 || data.success) {
      // Only admins are authorized to view upstream XMax API credit balance
      if (isAdmin) {
        let remainingCredits: number | null = null;
        let userId: string | null = null;

        try {
          const balanceRes = await fetch("https://api.xmax.ai/open/api/v1/balance", {
            headers: { "X-Api-Key": apiKey },
            cache: "no-store",
          });
          if (balanceRes.ok) {
            const bData = await balanceRes.json().catch(() => ({}));
            if (bData.success && bData.data) {
              remainingCredits = typeof bData.data.currentBalance === "number" ? bData.data.currentBalance : null;
              userId = bData.data.userId || null;
            }
          }
        } catch {
          // Ignore balance fetch failure
        }

        return NextResponse.json({
          configured: true,
          valid: true,
          actualApiKey: apiKey,
          apiKey: apiKey,
          maskedKey: apiKey.slice(0, 6) + "..." + apiKey.slice(-4),
          remainingCredits,
          balance: remainingCredits,
          userId,
          region: "global",
        });
      }

      // For regular users/creators, return only operational flags without exposing upstream balance
      return NextResponse.json({
        configured: true,
        valid: true,
        apiKey: apiKey,
      });
    } else {
      if (isAdmin) {
        return NextResponse.json({
          configured: true,
          valid: false,
          actualApiKey: apiKey,
          code: data.code,
          error: data.message || "Invalid XMax API key",
        });
      }
      return NextResponse.json({
        configured: true,
        valid: false,
        error: "Neural engine temporarily offline",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ configured: true, valid: false, error: isAdmin ? message : "Neural engine connection error" });
  }
}

