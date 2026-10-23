import { NextResponse } from "next/server";
import { StreamBroadcastPayload } from "@/lib/videoEngine";

// Global in-memory frame buffer for cross-process OBS Studio CEF browser sources
const globalFrameBuffer = global as unknown as {
  _sage_stream_frames?: Map<string, StreamBroadcastPayload>;
};

if (!globalFrameBuffer._sage_stream_frames) {
  globalFrameBuffer._sage_stream_frames = new Map<string, StreamBroadcastPayload>();
}

export async function POST(req: Request) {
  try {
    const payload: StreamBroadcastPayload = await req.json();
    if (!payload.streamKey) {
      return NextResponse.json({ error: "Missing streamKey" }, { status: 400 });
    }

    globalFrameBuffer._sage_stream_frames!.set(payload.streamKey, payload);
    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error saving frame";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const streamKey = searchParams.get("key") || "sage_live_default";

  const frame = globalFrameBuffer._sage_stream_frames!.get(streamKey);
  if (!frame) {
    // If exact stream key not found, check if any active frame is available
    const firstFrame = globalFrameBuffer._sage_stream_frames!.values().next().value;
    if (firstFrame && Date.now() - firstFrame.timestamp < 10000) {
      return NextResponse.json(firstFrame);
    }
    return NextResponse.json({ isLive: false, error: "No frame available yet" }, { status: 404 });
  }

  // If frame is older than 8 seconds, consider stopped
  if (Date.now() - frame.timestamp > 8000) {
    return NextResponse.json({ ...frame, isLive: false });
  }

  return NextResponse.json(frame);
}
