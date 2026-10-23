import crypto from "crypto";

/**
 * Korapay Payment Gateway Service (Production Standards)
 * Official API Integration: https://korahq.com / https://api.korapay.com
 *
 * Supports hosted checkout initialization, transaction verification,
 * and cryptographically signed webhook processing.
 */

const publicKey = process.env.KORA_PUBLIC_KEY || "";
const secretKey = process.env.KORA_SECRET_KEY || "";
const encryptionKey = process.env.KORA_ENCRYPTION_KEY || "";

export const isKorapayConfigured = Boolean(
  publicKey &&
    secretKey &&
    !publicKey.includes("placeholder") &&
    !secretKey.includes("placeholder") &&
    publicKey.startsWith("pk_") &&
    secretKey.startsWith("sk_")
);

export interface KoraPaymentPayload {
  reference: string;
  amount: number;
  currency: string; // "NGN" or "USD"
  redirect_url: string;
  notification_url?: string;
  narration?: string;
  customer: {
    name: string;
    email: string;
  };
  channels?: string[]; // e.g. ["card", "bank_transfer", "pay_with_bank"]
}

export interface KoraVerifyResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    status: "success" | "failed" | "pending" | "processing";
    amount: number;
    fee: number;
    currency: string;
    customer: {
      name: string;
      email: string;
    };
    payment_method?: string;
    paid_at?: string;
  };
}

/**
 * Initiates Korapay Checkout.
 * Returns the hosted checkout URL where user can complete payment securely.
 */
export async function initiatePayment(
  payload: KoraPaymentPayload
): Promise<{ checkoutUrl: string; reference: string }> {
  if (!isKorapayConfigured) {
    throw new Error("Korapay keys are not configured in environment variables");
  }

  // Ensure clean alphanumeric + underscore reference
  const cleanRef = payload.reference.replace(/[^a-zA-Z0-9_-]/g, "_");

  const body = {
    amount: payload.amount,
    currency: payload.currency || "NGN",
    reference: cleanRef,
    narration: payload.narration || "Sage AI Credits Top-Up",
    redirect_url: payload.redirect_url,
    notification_url: payload.notification_url,
    customer: {
      name: payload.customer.name || "Valued Creator",
      email: payload.customer.email,
    },
    channels: payload.channels || ["card", "bank_transfer", "pay_with_bank"],
  };

  const res = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (res.ok && data.status && data.data?.checkout_url) {
    return {
      checkoutUrl: data.data.checkout_url,
      reference: cleanRef,
    };
  }

  const errorMsg = data.message || data.error || "Failed to initialize payment with Korapay";
  console.error("[Korapay Error] Initialization failed:", data);
  throw new Error(errorMsg);
}

/**
 * Server-side transaction verification with Korapay by reference.
 */
export async function verifyTransaction(reference: string): Promise<KoraVerifyResponse> {
  if (!isKorapayConfigured) {
    throw new Error("Korapay is not configured");
  }

  const cleanRef = reference.replace(/[^a-zA-Z0-9_-]/g, "_");

  const res = await fetch(`https://api.korapay.com/merchant/api/v1/charges/${encodeURIComponent(cleanRef)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

  const data: KoraVerifyResponse = await res.json();
  return data;
}

/**
 * Verifies webhook HMAC signature from Korapay header x-korapay-signature
 */
export function verifyWebhookSignature(signature: string, rawBody: string): boolean {
  if (!signature || !secretKey) return false;
  try {
    const computed = crypto.createHmac("sha256", secretKey).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
  } catch {
    return false;
  }
}
