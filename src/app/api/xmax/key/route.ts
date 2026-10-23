import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.XMAX_API_KEY || process.env.NEXT_PUBLIC_XMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ apiKey: null });
  }
  return NextResponse.json({ apiKey });
}
