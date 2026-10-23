import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const isStripeConfigured = Boolean(
  stripeSecretKey &&
    !stripeSecretKey.includes("placeholder") &&
    stripeSecretKey.startsWith("sk_")
);

export const stripe: Stripe | null = isStripeConfigured
  ? new Stripe(stripeSecretKey as string, {
      apiVersion: "2025-02-24.acacia" as unknown as undefined,
      typescript: true,
    })
  : null;
