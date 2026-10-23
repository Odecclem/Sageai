import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sessionStore } from "@/lib/sessionStore";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const { streamKey, personaId, action } = body;

    if (!streamKey) {
      return NextResponse.json({ error: "Stream key is required" }, { status: 400 });
    }

    if (action === "stop") {
      const session = sessionStore.stopStream(streamKey);
      return NextResponse.json({ success: true, session, isLive: false });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in with your creator account to start streaming" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const userName = user.name;

    const result = sessionStore.startStream(streamKey, personaId || "anime-shonen", userId, userName);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 402 });
    }

    return NextResponse.json({
      success: true,
      session: result.session,
      isLive: true,
      burnRatePerSecond: 1,
      balance: sessionStore.getUser(userId).creditBalance,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
