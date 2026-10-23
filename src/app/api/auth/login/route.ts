import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { userStore, verifyPassword } from "@/lib/userStore";
import { createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 });
    }

    const user = userStore.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    userStore.recordLogin(user.id);

    const safeUser = userStore.getSafeUserById(user.id)!;
    const token = createSessionToken(safeUser);
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
      message: "Signed in successfully!",
      user: safeUser,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal login error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
