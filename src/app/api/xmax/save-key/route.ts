import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { apiKey } = await req.json();
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      return NextResponse.json({ success: false, error: "API key is required" }, { status: 400 });
    }

    const cleanKey = apiKey.trim();

    // Verify key with XMax Global endpoint and fetch balance concurrently
    const [res, balanceRes] = await Promise.all([
      fetch("https://api.xmax.ai/open/api/v1/cos/sts", {
        headers: { "X-Api-Key": cleanKey },
      }),
      fetch("https://api.xmax.ai/open/api/v1/balance", {
        headers: { "X-Api-Key": cleanKey },
      }).catch(() => null),
    ]);

    const data = await res.json().catch(() => ({}));
    if (data.code !== 200 && !data.success) {
      return NextResponse.json(
        {
          success: false,
          error: data.message || "Invalid XMax API key according to platform.xmax.ai",
          code: data.code,
        },
        { status: 401 }
      );
    }

    let remainingCredits: number | null = null;
    let userId: string | null = null;
    if (balanceRes && balanceRes.ok) {
      const bData = await balanceRes.json().catch(() => ({}));
      if (bData.success && bData.data) {
        remainingCredits = typeof bData.data.currentBalance === "number" ? bData.data.currentBalance : null;
        userId = bData.data.userId || null;
      }
    }

    // Key is verified! Save to .env.local
    const envPath = path.join(process.cwd(), ".env.local");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    if (content.includes("XMAX_API_KEY=")) {
      content = content.replace(/XMAX_API_KEY=.*/, `XMAX_API_KEY=${cleanKey}`);
    } else {
      content += `\nXMAX_API_KEY=${cleanKey}\nNEXT_PUBLIC_XMAX_API_KEY=${cleanKey}\n`;
    }

    if (!content.includes("NEXT_PUBLIC_XMAX_API_KEY=")) {
      content += `\nNEXT_PUBLIC_XMAX_API_KEY=${cleanKey}\n`;
    } else {
      content = content.replace(/NEXT_PUBLIC_XMAX_API_KEY=.*/, `NEXT_PUBLIC_XMAX_API_KEY=${cleanKey}`);
    }

    fs.writeFileSync(envPath, content, "utf-8");
    process.env.XMAX_API_KEY = cleanKey;
    process.env.NEXT_PUBLIC_XMAX_API_KEY = cleanKey;

    return NextResponse.json({
      success: true,
      valid: true,
      message: "XMax API key verified and connected successfully!",
      actualApiKey: cleanKey,
      apiKey: cleanKey,
      maskedKey: cleanKey.slice(0, 6) + "..." + cleanKey.slice(-4),
      remainingCredits,
      userId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
