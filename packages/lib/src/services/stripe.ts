export function createCheckoutSessionPlaceholder() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { url: "https://example.com/stripe-placeholder" };
  }
  return { url: "https://example.com/stripe-placeholder" };
}
