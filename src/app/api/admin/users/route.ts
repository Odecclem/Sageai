import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth";
import { userStore } from "@/lib/userStore";

export async function GET() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized. Administrator privileges required." }, { status: 403 });
  }

  const users = userStore.getAllUsers();
  return NextResponse.json({
    success: true,
    users,
    count: users.length,
  });
}

export async function POST(req: Request) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized. Administrator privileges required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role = "user", initialCredits = 0 } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Name, email, and password are required" }, { status: 400 });
    }

    const result = userStore.createUser({
      name,
      email,
      password,
      role: role === "admin" ? "admin" : "user",
      initialCredits: typeof initialCredits === "number" ? initialCredits : (Number(initialCredits) || 0),
    });

    if (!result.success || !result.user) {
      return NextResponse.json({ success: false, error: result.error || "Failed to create user" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${result.user.name} created successfully!`,
      user: result.user,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating user";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
