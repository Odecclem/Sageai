import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { userStore } from "@/lib/userStore";
import { createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ success: false, error: "Please enter your full name (at least 2 characters)" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ success: false, error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const result = userStore.createUser({
      name: name.trim(),
      email: email.trim(),
      password,
      role: "user",
      initialCredits: 0,
    });

    if (!result.success || !result.user) {
      return NextResponse.json({ success: false, error: result.error || "Failed to create account" }, { status: 400 });
    }

    // Generate session token and set cookie
    const token = createSessionToken(result.user);
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 14 * 24 * 60 * 60, // 14 days
    });

    return NextResponse.json({
      success: true,
      message: "Account created successfully!",
      user: result.user,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal registration error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
