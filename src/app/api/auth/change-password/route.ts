import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { userStore, verifyPassword } from "@/lib/userStore";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Verify current password against stored hash
    const fullUser = userStore.getUserById(user.id);
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isValid = verifyPassword(currentPassword, fullUser.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // Update password
    const success = userStore.updatePassword(user.id, newPassword);
    if (!success) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
