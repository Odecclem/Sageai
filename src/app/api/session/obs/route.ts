import { NextResponse } from "next/server";
import { sessionStore } from "@/lib/sessionStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const streamKey = searchParams.get("key");

  if (!streamKey) {
    return NextResponse.json({ error: "Missing stream key" }, { status: 400 });
  }

  const session = sessionStore.getOrCreateSession(streamKey);
  const user = sessionStore.getUser(session.userId);

  return NextResponse.json({
    streamKey,
    isLive: session.isLive && user.creditBalance > 0,
    personaId: session.personaId,
    balance: user.creditBalance,
    startedAt: session.startedAt,
    lastHeartbeat: session.lastHeartbeat,
  });
}
