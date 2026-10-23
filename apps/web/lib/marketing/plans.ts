export type PlanKey = "parish" | "congregation" | "network";
export type BillingCycle = "monthly" | "annual";

export type Plan = {
  key: PlanKey;
  name: string;
  tagline: string;
  /** Price in whole dollars, per month, when billed monthly. */
  monthly: number;
  /** Per-month equivalent when billed annually (two months free). */
  annual: number;
  memberCap: string;
  featured?: boolean;
  highlights: string[];
};

/** Annual billing bills 10 months up front — two months free. */
export const ANNUAL_MONTHS_CHARGED = 10;

export const PLANS: Plan[] = [
  {
    key: "parish",
    name: "Parish",
    tagline: "For smaller churches getting Sunday off a spreadsheet.",
    monthly: 74,
    annual: 62,
    memberCap: "Up to 150 members",
    highlights: [
      "Volunteer scheduling and confirmations",
      "Service plans and run-of-show",
      "Announcements and events",
      "Member mobile app",
      "Email reminders",
      "Unlimited admins",
    ],
  },
  {
    key: "congregation",
    name: "Congregation",
    tagline: "For growing churches with several ministry teams.",
    monthly: 149,
    annual: 124,
    memberCap: "Up to 500 members",
    featured: true,
    highlights: [
      "Everything in Parish",
      "Gather AI: fill open roles in one click",
      "Unlimited ministry teams and roles",
      "Service presets and templates",
      "Backup assignments and auto-promotion",
      "Roster health and serving reports",
      "Priority email support",
    ],
  },
  {
    key: "network",
    name: "Network",
    tagline: "For larger churches that want the most help getting started.",
    monthly: 225,
    annual: 188,
    memberCap: "Unlimited members",
    highlights: [
      "Everything in Congregation",
      "No member limit",
      "Dedicated onboarding call",
      "Hands-on help importing your people",
    ],
  },
];

export function priceFor(plan: Plan, cycle: BillingCycle) {
  return cycle === "monthly" ? plan.monthly : plan.annual;
}

export function annualTotal(plan: Plan) {
  return plan.monthly * ANNUAL_MONTHS_CHARGED;
}

/** Full matrix for the comparison table. */
export const COMPARISON: { group: string; rows: { label: string; values: [string, string, string] }[] }[] = [
  {
    group: "People",
    rows: [
      { label: "Members", values: ["150", "500", "Unlimited"] },
      { label: "Admin accounts", values: ["Unlimited", "Unlimited", "Unlimited"] },
      { label: "Ministry teams", values: ["5", "Unlimited", "Unlimited"] },
    ],
  },
  {
    group: "Scheduling",
    rows: [
      { label: "Volunteer roles and slots", values: ["Included", "Included", "Included"] },
      { label: "Confirm or decline in the app", values: ["Included", "Included", "Included"] },
      { label: "Backup assignments", values: ["—", "Included", "Included"] },
      { label: "Auto-promote backup on decline", values: ["—", "Included", "Included"] },
      { label: "Serving history and roster health", values: ["—", "Included", "Included"] },
      { label: "Gather AI schedule fill", values: ["—", "Included", "Included"] },
    ],
  },
  {
    group: "Services",
    rows: [
      { label: "Service plans and run-of-show", values: ["Included", "Included", "Included"] },
      { label: "Reusable service presets", values: ["1", "Unlimited", "Unlimited"] },
      { label: "Printable run sheets", values: ["Included", "Included", "Included"] },
    ],
  },
  {
    group: "Communication",
    rows: [
      { label: "Announcements with audiences", values: ["Included", "Included", "Included"] },
      { label: "Events and RSVPs", values: ["Included", "Included", "Included"] },
      { label: "Push notifications", values: ["Included", "Included", "Included"] },
      { label: "Member mobile app", values: ["Included", "Included", "Included"] },
    ],
  },
  {
    group: "Support",
    rows: [
      { label: "Email support", values: ["Included", "Priority", "Priority"] },
      { label: "Onboarding call + data move-in", values: ["—", "—", "Included"] },
      { label: "Data export", values: ["—", "Included", "Included"] },
    ],
  },
];

export const PRICING_FAQ = [
  {
    q: "Is there a free trial?",
    a: "Yes. Every church gets 14 days with everything in Congregation, Gather AI included, and no card to begin. Nothing is charged unless you choose a plan. If you don't, Gather turns read-only: everything you set up stays, but nothing new can be added until you choose a plan.",
  },
  {
    q: "What counts as a member?",
    a: "Anyone with a profile in your church directory. Volunteers, staff, and attendees all count once. Admins are never charged separately.",
  },
  {
    q: "Can we change plans later?",
    a: "Any time, in both directions. Changes are prorated, so you only pay the difference for the days remaining in your cycle.",
  },
  {
    q: "What happens if we outgrow our plan?",
    a: "Nothing breaks. We'll let you know you've passed the member count and give you a month to move up at your convenience.",
  },
  {
    q: "Do you offer a discount for church plants or student organizations?",
    a: "We do. Student organizations (campus ministries and college fellowships) always get a discount, and so do churches under two years old or under fifty people. Email us and we'll take care of you.",
  },
  {
    q: "What's a founding church?",
    a: "One of the first 10 churches to choose a paid plan. Founding churches keep the price they signed up at for as long as their subscription stays active, even if our prices go up, and get a free 1-on-1 setup session with us. The pricing page shows how many spots are left.",
  },
  {
    q: "What if Gather isn't right for us?",
    a: "Then you shouldn't pay for it. On top of the 14-day free trial, every plan has a 14-day money-back guarantee: email us within 14 days of your first payment and we'll refund it in full.",
  },
  {
    q: "Can we pay by check or ACH instead of a card?",
    a: "Yes. At checkout you can pay from your church's bank account (ACH), or choose \"Pay by invoice\" in your account and we'll email an invoice due in 30 days that you can pay by ACH, bank transfer or check.",
  },
  {
    q: "How do we cancel?",
    a: "From Account → Manage billing, in a couple of clicks, or just email us. No phone call, no retention pitch. You keep access through the end of the period you've paid for, and you can export all of your church's data on the way out.",
  },
];
