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

    // Verify key with Fal.ai
    const res = await fetch("https://rest.alpha.fal.ai/users/current", {
      headers: { Authorization: `Key ${cleanKey}` },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: "Invalid Fal.ai API key (authorization rejected)" },
        { status: 401 }
      );
    }

    const data = await res.json();

    // Save to .env.local
    const envPath = path.join(process.cwd(), ".env.local");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    if (content.includes("FAL_KEY=")) {
      content = content.replace(/FAL_KEY=.*/, `FAL_KEY=${cleanKey}`);
    } else {
      content += `\nFAL_KEY=${cleanKey}\n`;
    }

    fs.writeFileSync(envPath, content, "utf-8");
    process.env.FAL_KEY = cleanKey;

    return NextResponse.json({
      success: true,
      valid: true,
      userName: data.full_name || data.nickname,
      email: data.email,
      maskedKey: cleanKey.slice(0, 10) + "..." + cleanKey.slice(-4),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
