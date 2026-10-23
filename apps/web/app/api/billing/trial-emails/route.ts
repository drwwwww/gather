import { NextResponse } from "next/server";
import { sendEmail } from "@gather/lib";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import { escapeHtml } from "../../../../lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Trial email sequence (migration 0056), run daily by Vercel Cron. Each church
 * in its trial gets, to its admins:
 *   welcome — day 1: three steps to a first Sunday
 *   midway  — 7 days left: what they've built, and what a plan costs
 *   ending  — 2 days left: it goes read-only on {day}
 *   ended   — the day it ends: everything is still here, pick a plan
 * Only the latest stage that applies is sent; earlier ones are marked done so a
 * church that signed up before this shipped doesn't get four emails at once.
 */
type Kind = "welcome" | "midway" | "ending" | "ended";
const ORDER: Kind[] = ["welcome", "midway", "ending", "ended"];

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://gatherministry.online").replace(/\/$/, "");

function stageFor(daysLeft: number, endedDaysAgo: number): Kind | null {
  if (daysLeft <= 0) return endedDaysAgo <= 3 ? "ended" : null;
  if (daysLeft <= 2) return "ending";
  if (daysLeft <= 7) return "midway";
  if (daysLeft <= 13) return "welcome";
  return null;
}

type Counts = { people: number; plans: number; posts: number };

function button(href: string, label: string) {
  return `<p style="margin:24px 0"><a href="${href}" style="background:#f59e0b;color:#1c1917;padding:12px 20px;border-radius:12px;font-weight:600;text-decoration:none;display:inline-block">${label}</a></p>`;
}

const SMALL_PRINT = `<p style="color:#78716c;font-size:13px">Yearly plans get two months free. Church plants, student organizations and churches under 50 people can ask for reduced pricing — just reply to this email. Prefer an invoice? You can pay by ACH or check. Every plan has a 14-day money-back guarantee.</p>`;

function emailFor(kind: Kind, church: string, endsOn: string, c: Counts): { subject: string; html: string } {
  const name = escapeHtml(church);
  const plan = `${SITE}/account#plan`;
  switch (kind) {
    case "welcome":
      return {
        subject: `Your first Sunday on Gather, in three steps`,
        html: `<p>Welcome to Gather, ${name}.</p>
<p>Most churches are fully set up in under an hour. Here's the order that works:</p>
<ol>
<li><b>Add your service times</b> on Settings, so every plan lands on the right day.</li>
<li><b>Invite your service team.</b> They get the app, see where they're serving and answer with one tap.</li>
<li><b>Build next week's plan</b> — order of service and team. Try <b>Fill with AI</b> to staff it in seconds.</li>
</ol>
${button(`${SITE}/admin`, "Open Gather")}
<p>Your trial runs until ${escapeHtml(endsOn)}, with everything included. Questions? Just reply — a real person reads these.</p>`,
      };
    case "midway":
      return {
        subject: `One week left in your Gather trial`,
        html: `<p>Halfway there. Here's what ${name} has in Gather so far:</p>
<ul>
<li><b>${c.people}</b> ${c.people === 1 ? "person" : "people"} in your church</li>
<li><b>${c.plans}</b> service ${c.plans === 1 ? "plan" : "plans"}</li>
<li><b>${c.posts}</b> ${c.posts === 1 ? "announcement" : "announcements"}</li>
</ul>
<p>Your trial ends ${escapeHtml(endsOn)}. Choose a plan any time before then and nothing changes — your team keeps getting reminders and answering in the app.</p>
${button(plan, "Choose your plan")}
${SMALL_PRINT}`,
      };
    case "ending":
      return {
        subject: `Your Gather trial ends ${endsOn}`,
        html: `<p>Your trial for ${name} ends <b>${escapeHtml(endsOn)}</b>.</p>
<p>After that, Gather goes read-only: you'll still see everything, but you won't be able to plan services, schedule volunteers or post announcements, and Gather AI turns off.${c.plans > 0 ? ` Your ${c.plans} service ${c.plans === 1 ? "plan stays" : "plans stay"} right where they are.` : ""}</p>
<p>Choosing a plan takes about two minutes and keeps Sunday running without a gap.</p>
${button(plan, "Keep everything running")}
${SMALL_PRINT}`,
      };
    case "ended":
      return {
        subject: `Your Gather trial has ended — everything is still here`,
        html: `<p>The trial for ${name} has ended, and Gather is now read-only.</p>
<p>Nothing was deleted. Your people, plans and announcements are exactly where you left them. Pick a plan and you're back to planning in a couple of minutes.</p>
${button(plan, "Choose a plan")}
${SMALL_PRINT}`,
      };
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = createSupabaseAdminClient() as any;
  const since = new Date(Date.now() - 4 * 86_400_000).toISOString();
  const { data: churches, error } = await db
    .from("churches")
    .select("id, name, timezone, plan_status, stripe_subscription_id, trial_ends_at")
    .is("stripe_subscription_id", null)
    .neq("plan_status", "active")
    .gte("trial_ends_at", since);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  const now = Date.now();
  for (const ch of (churches ?? []) as { id: string; name: string; timezone: string | null; trial_ends_at: string }[]) {
    const ends = new Date(ch.trial_ends_at).getTime();
    const daysLeft = Math.ceil((ends - now) / 86_400_000);
    const kind = stageFor(daysLeft, Math.floor((now - ends) / 86_400_000));
    if (!kind) continue;

    const { data: done } = await db.from("trial_email_log").select("kind").eq("church_id", ch.id);
    const doneKinds = new Set(((done ?? []) as { kind: Kind }[]).map((r) => r.kind));
    if (doneKinds.has(kind)) continue;

    // Claim this stage (and any skipped earlier ones) before sending, so an
    // overlapping run can't send it twice.
    const claim = ORDER.slice(0, ORDER.indexOf(kind) + 1)
      .filter((k) => !doneKinds.has(k))
      .map((k) => ({ church_id: ch.id, kind: k }));
    const { error: claimError } = await db.from("trial_email_log").insert(claim);
    if (claimError) continue;

    const [admins, people, plans, posts] = await Promise.all([
      db.from("profiles").select("email, disabled").eq("church_id", ch.id).eq("role", "ADMIN"),
      db.from("profiles").select("id", { count: "exact", head: true }).eq("church_id", ch.id),
      db.from("service_plans").select("id", { count: "exact", head: true }).eq("church_id", ch.id),
      db.from("announcements").select("id", { count: "exact", head: true }).eq("church_id", ch.id),
    ]);
    const endsOn = new Date(ends).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: ch.timezone || "America/New_York",
    });
    const { subject, html } = emailFor(kind, ch.name, endsOn, {
      people: people.count ?? 0,
      plans: plans.count ?? 0,
      posts: posts.count ?? 0,
    });
    for (const a of (admins.data ?? []) as { email: string | null; disabled: boolean }[]) {
      if (!a.email || a.disabled) continue;
      const res = await sendEmail(a.email, subject, html);
      if (res.ok) sent++;
    }
  }

  return NextResponse.json({ checked: churches?.length ?? 0, sent });
}
