import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { sessionStore } from "@/lib/sessionStore";

export async function GET() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const activeStreams = sessionStore.getActiveSessions();
  return NextResponse.json({
    success: true,
    streams: activeStreams,
    count: activeStreams.length,
  });
}

export async function POST(req: Request) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  try {
    const { streamKey } = await req.json();
    if (!streamKey) {
      return NextResponse.json({ success: false, error: "Stream key is required" }, { status: 400 });
    }

    const terminated = sessionStore.terminateSession(streamKey);
    return NextResponse.json({
      success: true,
      message: terminated ? `Stream ${streamKey} has been terminated.` : `Stream ${streamKey} was not found or already inactive.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error terminating stream";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
