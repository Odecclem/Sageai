import { NextResponse } from "next/server";
import { userStore } from "@/lib/userStore";
import { sessionStore } from "@/lib/sessionStore";
import { isFlutterwaveConfigured } from "@/lib/flutterwave";
import { isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  try {
    const stats = userStore.getStats();
    const activeStreams = sessionStore.getActiveSessions();

    return NextResponse.json({
      status: "healthy",
      service: "Sage AI Live Video Platform",
      version: "1.0.0-production",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: isSupabaseConfigured ? "Supabase PostgreSQL (Cloud)" : "Local File System JSON (Fallback)",
      metrics: {
        totalUsers: stats.totalUsers,
        activeStreams: activeStreams.length,
        supabaseConfigured: isSupabaseConfigured,
        flutterwaveConfigured: isFlutterwaveConfigured,
        cloudGpuAvailable: Boolean(process.env.XMAX_API_KEY),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Service unhealthy";
    return NextResponse.json({ status: "degraded", error: msg }, { status: 500 });
  }
}
