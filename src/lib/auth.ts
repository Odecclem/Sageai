import { cookies } from "next/headers";
import crypto from "crypto";
import { userStore, SafeUser, User } from "./userStore";

const AUTH_COOKIE_NAME = "sage_session_token";
const AUTH_SECRET = process.env.AUTH_SECRET || "sage_ai_production_secret_key_2026_x89d";

/**
 * Creates a signed session token:
 * base64(userId:role:expiresAt:signature)
 */
export function createSessionToken(user: SafeUser | User): string {
  const expiresAt = Date.now() + 14 * 24 * 60 * 60 * 1000; // 14 days
  const payload = `${user.id}:${user.role}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64");
}

/**
 * Verifies a session token and returns decoded payload if valid and not expired
 */
export function verifySessionToken(token: string): { userId: string; role: "admin" | "user" } | null {
  try {
    const raw = Buffer.from(token, "base64").toString("utf-8");
    const parts = raw.split(":");
    if (parts.length !== 4) return null;

    const [userId, role, expiresAtStr, signature] = parts;
    const expiresAt = Number(expiresAtStr);
    if (isNaN(expiresAt) || expiresAt < Date.now()) {
      return null;
    }

    const expectedSig = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(`${userId}:${role}:${expiresAtStr}`)
      .digest("hex");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    return { userId, role: role as "admin" | "user" };
  } catch {
    return null;
  }
}

/**
 * Retrieves the currently authenticated user from incoming request cookies or next/headers
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const verified = verifySessionToken(token);
    if (!verified) return null;

    return userStore.getSafeUserById(verified.userId);
  } catch {
    return null;
  }
}

/**
 * Checks if the current request is from an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user && user.role === "admin";
}

export { AUTH_COOKIE_NAME };
