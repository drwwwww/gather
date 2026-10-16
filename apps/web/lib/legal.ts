/**
 * Single source of truth for the facts every legal page repeats. When Gather
 * becomes an LLC, change OPERATOR (and LEGAL_EFFECTIVE) here and every page,
 * plus the App Store / Play listings, should be updated to match.
 */
export const OPERATOR = "Andrew Bernadel, doing business as Gather";
export const OPERATOR_SHORT = "Gather";
export const GOVERNING_STATE = "Georgia";
export const SUPPORT_EMAIL = "support@gatherministry.online";
export const PRIVACY_EMAIL = "support@gatherministry.online";
export const LEGAL_EFFECTIVE = "October 15, 2026";

export type LegalDocKey = "privacy" | "terms" | "dpa" | "delete-account";

export const LEGAL_DOCS: { key: LegalDocKey; href: string; label: string }[] = [
  { key: "privacy", href: "/privacy", label: "Privacy" },
  { key: "terms", href: "/terms", label: "Terms" },
  { key: "dpa", href: "/dpa", label: "Data processing" },
  { key: "delete-account", href: "/delete-account", label: "Delete your account" },
];

/** Every third party that touches personal data, shown on /privacy and /dpa. */
export const SUBPROCESSORS = [
  { name: "Supabase", purpose: "Database, sign-in, and photo storage", data: "All account, profile, and church data", location: "United States" },
  { name: "Vercel", purpose: "Hosting for the website and web app", data: "Web requests, including IP address", location: "United States" },
  { name: "Brevo", purpose: "Sending email (reminders, receipts, demo replies)", data: "Name, email address, message content", location: "European Union" },
  { name: "Expo", purpose: "Delivering push notifications to the mobile app", data: "Push token, notification text", location: "United States" },
  { name: "Sentry", purpose: "Crash and error reports", data: "Device and app details, masked screen replays around an error", location: "United States" },
  { name: "Stripe", purpose: "Subscription billing for churches", data: "Billing contact and payment details (we never see full card numbers)", location: "United States" },
  { name: "OpenStreetMap (Nominatim)", purpose: "Turning a church's street address into map coordinates", data: "Church address only", location: "United Kingdom / European Union" },
  { name: "Apple and Google", purpose: "App distribution and push delivery to devices", data: "Push token, notification text", location: "United States" },
];
