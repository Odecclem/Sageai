/**
 * Flutterwave Payment Gateway Service (Company Standard)
 *
 * Implements standard hosted checkout links and server-side transaction verification
 * using Flutterwave v3 REST API and SDK.
 *
 * Configuration:
 *   FLW_PUBLIC_KEY   - (e.g. FLWPUBK_TEST-xxx or FLWPUBK-xxx)
 *   FLW_SECRET_KEY   - (e.g. FLWSECK_TEST-xxx or FLWSECK-xxx)
 *   FLW_SECRET_HASH  - Custom webhook secret set in Dashboard -> Settings -> Webhooks
 */

const publicKey = process.env.FLW_PUBLIC_KEY || "";
const secretKey = process.env.FLW_SECRET_KEY || "";

export const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH || "";

export const isFlutterwaveConfigured = Boolean(
  publicKey &&
    secretKey &&
    !publicKey.includes("placeholder") &&
    !secretKey.includes("placeholder") &&
    publicKey.startsWith("FLWPUBK") &&
    secretKey.startsWith("FLWSECK")
);

export interface FlwPaymentPayload {
  tx_ref: string;
  amount: number;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    name: string;
    phonenumber?: string;
  };
  customizations: {
    title: string;
    description: string;
    logo?: string;
  };
  meta?: Record<string, string>;
}

/**
 * Initiates Flutterwave Standard hosted checkout.
 * Returns the secure payment link URL where customer is redirected to pay.
 */
export async function initiatePayment(
  payload: FlwPaymentPayload
): Promise<{ link: string }> {
  if (!isFlutterwaveConfigured) {
    throw new Error("Flutterwave keys are not configured or still have placeholder values");
  }

  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (res.ok && data.status === "success" && data.data?.link) {
    return { link: data.data.link };
  }

  throw new Error(data.message || "Failed to generate Flutterwave payment link");
}

/**
 * Server-side verification of transaction by Flutterwave transaction ID.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyTransaction(transactionId: string): Promise<{ status: string; data: any }> {
  if (!isFlutterwaveConfigured) {
    throw new Error("Flutterwave is not configured");
  }

  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();
  return data;
}
