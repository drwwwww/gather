import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@gather/lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SALES_INBOX = process.env.DEMO_REQUEST_INBOX || "support@gatherministry.online";

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  church: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  size: z.string().trim().max(40),
  when: z.string().trim().max(40),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().optional(),
});

const SIZE_LABELS: Record<string, string> = {
  "under-50": "Under 50",
  "50-150": "50 – 150",
  "150-350": "150 – 350",
  "350-500": "350 – 500",
  "500-plus": "500+",
};

const TIME_LABELS: Record<string, string> = {
  "weekday-morning": "Weekday morning",
  "weekday-afternoon": "Weekday afternoon",
  "weekday-evening": "Weekday evening",
  flexible: "Flexible",
};

/** Escape user-supplied text before it goes into an HTML email body. */
function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form and try again." },
      { status: 400 }
    );
  }

  const d = parsed.data;
  // Honeypot tripped: pretend success so the bot moves on, but send nothing —
  // otherwise this route mails a "confirmation" to any address a bot supplies.
  if (d.website) return NextResponse.json({ ok: true });
  const sizeLabel = SIZE_LABELS[d.size] ?? d.size;
  const timeLabel = TIME_LABELS[d.when] ?? d.when;

  const internalHtml = `
    <h2 style="font-family:Arial,sans-serif;color:#1c1209">New demo request</h2>
    <table style="font-family:Arial,sans-serif;font-size:14px;color:#1c1209;border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0"><strong>Name</strong></td><td>${esc(d.name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0"><strong>Church</strong></td><td>${esc(d.church)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0"><strong>Email</strong></td><td>${esc(d.email)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0"><strong>Phone</strong></td><td>${esc(d.phone || "—")}</td></tr>
      <tr><td style="padding:4px 12px 4px 0"><strong>Size</strong></td><td>${esc(sizeLabel)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0"><strong>Best time</strong></td><td>${esc(timeLabel)}</td></tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#1c1209;white-space:pre-wrap">${esc(d.message || "(no message)")}</p>
  `;

  const confirmationHtml = `
    <div style="font-family:Arial,sans-serif;color:#1c1209;line-height:1.6">
      <h2 style="font-weight:normal">Thanks, ${esc(d.name.split(" ")[0])} — we've got your request.</h2>
      <p>Someone from Gather will reply within one business day to find a time that works for ${esc(d.church)}.</p>
      <p>We'll set your service times up before the call, so you'll be looking at your own Sunday rather than a demo sandbox.</p>
      <p style="color:#9c8778;font-size:13px">If you need us sooner, just reply to this email.</p>
      <p style="color:#9c8778;font-size:13px">— The Gather team</p>
    </div>
  `;

  // The internal notification is what must not be lost; the confirmation is
  // best-effort so a bounce on the visitor's address can't fail their request.
  const internal = await sendEmail(
    SALES_INBOX,
    `Demo request — ${d.church} (${sizeLabel})`,
    internalHtml
  );

  if (!internal.ok) {
    console.error("[demo-request] internal email failed", internal.error);
    return NextResponse.json(
      { error: "We couldn't submit that just now. Please email support@gatherministry.online." },
      { status: 502 }
    );
  }

  const confirmation = await sendEmail(
    d.email,
    "We've got your Gather demo request",
    confirmationHtml
  );
  if (!confirmation.ok) {
    console.warn("[demo-request] confirmation email failed", confirmation.error);
  }

  return NextResponse.json({ ok: true });
}
