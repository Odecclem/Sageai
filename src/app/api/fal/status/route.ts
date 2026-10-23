import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, error: "FAL_KEY not set in .env.local" });
  }

  try {
    const res = await fetch("https://rest.alpha.fal.ai/users/current", {
      headers: { Authorization: `Key ${apiKey}` },
    });

    if (!res.ok) {
      return NextResponse.json({ configured: true, valid: false, status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      configured: true,
      valid: true,
      userName: data.full_name || data.nickname,
      email: data.email,
      isLocked: data.is_locked,
      lockReason: data.lock_reason,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ configured: true, valid: false, error: message });
  }
}
