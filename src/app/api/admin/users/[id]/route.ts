import { NextResponse } from "next/server";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/auth";
import { userStore } from "@/lib/userStore";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  const { id } = await params;
  const currentAdmin = await getCurrentUser();

  if (currentAdmin && currentAdmin.id === id) {
    return NextResponse.json({ success: false, error: "You cannot delete your own admin account." }, { status: 400 });
  }

  const result = userStore.deleteUser(id);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error || "Failed to delete user" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "User deleted successfully." });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { creditDelta, setCreditBalance, role } = body;

    // Credit adjustment
    if (typeof creditDelta === "number") {
      const res = userStore.updateCredits(id, creditDelta);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: `Adjusted credits by ${creditDelta > 0 ? "+" : ""}${creditDelta}`,
        newBalance: res.newBalance,
      });
    }

    // Set exact balance
    if (typeof setCreditBalance === "number") {
      const res = userStore.setCredits(id, setCreditBalance);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: `Set credit balance to ${setCreditBalance}`,
        newBalance: res.newBalance,
      });
    }

    // Role update
    if (role === "admin" || role === "user") {
      const currentAdmin = await getCurrentUser();
      if (currentAdmin && currentAdmin.id === id && role !== "admin") {
        return NextResponse.json({ success: false, error: "You cannot demote your own admin account." }, { status: 400 });
      }

      const res = userStore.updateRole(id, role);
      if (!res.success) {
        return NextResponse.json({ success: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: `User role updated to ${role}.` });
    }

    return NextResponse.json({ success: false, error: "No valid action provided" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating user";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
