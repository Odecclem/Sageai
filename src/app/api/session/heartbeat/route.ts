import { NextResponse } from "next/server";
import { sessionStore } from "@/lib/sessionStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { streamKey, seconds = 2, isStreaming = true } = body;

    if (!streamKey) {
      return NextResponse.json({ error: "Stream key is required" }, { status: 400 });
    }

    // If stream is live but frames are not actively streaming (e.g. XMax connecting or paused), 0 credits deducted
    if (isStreaming === false) {
      const session = sessionStore.getOrCreateSession(streamKey);
      const user = sessionStore.getUser(session.userId);
      return NextResponse.json({
        success: true,
        isLive: session.isLive,
        balance: user.creditBalance,
        creditsDeducted: 0,
        burnedOut: false,
        remainingSeconds: user.creditBalance,
        remainingMinutes: Number((user.creditBalance / 60).toFixed(1)),
      });
    }

    const heartbeatResult = sessionStore.processHeartbeat(streamKey, seconds);

    return NextResponse.json({
      success: true,
      ...heartbeatResult,
      remainingSeconds: heartbeatResult.balance,
      remainingMinutes: Number((heartbeatResult.balance / 60).toFixed(1)),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
