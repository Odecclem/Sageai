import { NextResponse } from "next/server";
import { sessionStore } from "@/lib/sessionStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { streamKey, seconds = 2 } = body;

    if (!streamKey) {
      return NextResponse.json({ error: "Stream key is required" }, { status: 400 });
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
