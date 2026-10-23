import { NextResponse } from "next/server";
import { sendEmail } from "@gather/lib";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";
import { getRequestUser } from "../../../../lib/apiAuth";
import { escapeHtml } from "../../../../lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Import people from a spreadsheet (People → Invite → Import). Church admins
 * only. Each row becomes a Gather account in this church (MEMBER or SERVICE —
 * never ADMIN) with an optional email carrying a link to set a password
 * (/auth/set-password). Someone who already has a Gather account is never moved
 * between churches; the row says so and the admin sends them the join link.
 * The client sends rows in chunks of up to 100.
 */
type InRow = { full_name?: string; email?: string; phone?: string; role?: string };
type Outcome = "added" | "already_here" | "has_account" | "invalid" | "failed";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function siteOrigin(request: Request) {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return request.headers.get("origin") || "https://gatherministry.online";
}

export async function POST(request: Request) {
  const caller = await getRequestUser(request);
  if (!caller) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { data: me } = await caller.supabase
    .from("profiles")
    .select("church_id, role, disabled, full_name")
    .eq("id", caller.user.id)
    .maybeSingle();
  const profile = me as { church_id: string | null; role: string; disabled: boolean; full_name: string | null } | null;
  if (!profile?.church_id || profile.role !== "ADMIN" || profile.disabled) {
    return NextResponse.json({ error: "Only church admins can import people." }, { status: 403 });
  }
  const churchId = profile.church_id;

  const { data: writable } = await caller.supabase.rpc("church_writable", { p_church_id: churchId });
  if (writable === false) {
    return NextResponse.json({ error: "Your trial has ended, so Gather is read-only. Choose a plan to add people." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { rows?: InRow[]; sendInvites?: boolean };
  const rows = Array.isArray(body.rows) ? body.rows.slice(0, 100) : [];
  if (rows.length === 0) return NextResponse.json({ error: "No people to import." }, { status: 400 });

  const db = createSupabaseAdminClient() as any;
  const { data: church } = await db.from("churches").select("name").eq("id", churchId).maybeSingle();
  const churchName: string = church?.name ?? "your church";
  const origin = siteOrigin(request);
  const iosUrl = process.env.NEXT_PUBLIC_GATHER_IOS_APP_URL;
  const androidUrl = process.env.NEXT_PUBLIC_GATHER_ANDROID_APP_URL;

  const results: { email: string; outcome: Outcome; message?: string }[] = [];

  for (const raw of rows) {
    const email = (raw.email ?? "").trim().toLowerCase();
    const fullName = (raw.full_name ?? "").trim().slice(0, 120) || null;
    const phone = (raw.phone ?? "").trim().slice(0, 40) || null;
    const role = raw.role === "SERVICE" ? "SERVICE" : "MEMBER";

    if (!EMAIL_RE.test(email)) {
      results.push({ email, outcome: "invalid", message: "Not a valid email address" });
      continue;
    }

    const { data: link, error: linkError } = await db.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: fullName ? { full_name: fullName } : {} },
    });

    if (linkError || !link?.user) {
      const { data: existing } = await db.from("profiles").select("church_id").eq("email", email).maybeSingle();
      if (existing?.church_id === churchId) results.push({ email, outcome: "already_here" });
      else if (existing || /already|registered|exists/i.test(linkError?.message ?? "")) {
        results.push({ email, outcome: "has_account", message: "Already has a Gather account — send them your join link" });
      } else results.push({ email, outcome: "failed", message: linkError?.message ?? "Couldn't create the account" });
      continue;
    }

    const userId: string = link.user.id;
    // generateLink also succeeds for someone invited earlier who never set a
    // password — never move them out of another church, and don't re-add them here.
    const { data: prior } = await db.from("profiles").select("church_id").eq("id", userId).maybeSingle();
    if (prior?.church_id && prior.church_id !== churchId) {
      results.push({ email, outcome: "has_account", message: "Already has a Gather account — send them your join link" });
      continue;
    }
    if (prior?.church_id === churchId) {
      results.push({ email, outcome: "already_here" });
      continue;
    }
    const { error: profileError } = await db
      .from("profiles")
      .upsert({ id: userId, church_id: churchId, full_name: fullName, email, role, disabled: false }, { onConflict: "id" });
    if (profileError) {
      results.push({ email, outcome: "failed", message: profileError.message });
      continue;
    }
    if (phone) await db.from("profile_private").upsert({ user_id: userId, phone }, { onConflict: "user_id" });

    if (body.sendInvites !== false && link.properties?.hashed_token) {
      const href = `${origin}/auth/set-password?token_hash=${encodeURIComponent(link.properties.hashed_token)}&type=invite`;
      const first = fullName ? escapeHtml(fullName.split(" ")[0]) : "there";
      const apps = [iosUrl && `<a href="${iosUrl}">iPhone</a>`, androidUrl && `<a href="${androidUrl}">Android</a>`].filter(Boolean).join(" · ");
      await sendEmail(
        email,
        `${churchName} added you to Gather`,
        `<p>Hi ${first},</p>
<p>${escapeHtml(profile.full_name || "Your church")} added you to <b>${escapeHtml(churchName)}</b> on Gather — where your church shares news and events${role === "SERVICE" ? " and where you'll see when you're serving and confirm with one tap" : ""}.</p>
<p style="margin:24px 0"><a href="${href}" style="background:#f59e0b;color:#1c1917;padding:12px 20px;border-radius:12px;font-weight:600;text-decoration:none;display:inline-block">Set your password</a></p>
${apps ? `<p>Then get the app: ${apps}, and sign in with ${escapeHtml(email)}.</p>` : `<p>Then sign in with ${escapeHtml(email)}.</p>`}
<p style="color:#78716c;font-size:13px">If the button has expired, open the link anyway and ask for a new one. Didn't expect this? You can ignore it.</p>`
      );
    }
    results.push({ email, outcome: "added" });
  }

  return NextResponse.json({ results });
}
