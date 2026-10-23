import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { userStore, verifyPassword } from "@/lib/userStore";
import { createSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";

/**
 * POST /api/auth/admin-login
 * Dedicated authentication endpoint strictly for Platform Administrators.
 * Rejects any non-admin accounts even if the password is correct.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Administrator email and password are required" },
        { status: 400 }
      );
    }

    const user = userStore.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid administrator credentials" },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid administrator credentials" },
        { status: 401 }
      );
    }

    // STRICT ROLE ENFORCEMENT: Only accounts with role 'admin' may authenticate here
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Access Denied: This portal is strictly for platform administrators. Creator accounts must log in at /login.",
        },
        { status: 403 }
      );
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
      maxAge: 7 * 24 * 60 * 60, // 7 days for admin sessions
    });

    return NextResponse.json({
      success: true,
      message: "Administrator session authorized",
      user: safeUser,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal login error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
