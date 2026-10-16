import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@gather/lib";
import { getRequestUser } from "../../../../lib/apiAuth";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORT_INBOX = process.env.DEMO_REQUEST_INBOX || "support@gatherministry.online";

const schema = z.object({
  reportedUserId: z.string().uuid(),
  reason: z.enum(["INAPPROPRIATE", "HARASSMENT", "SPAM", "IMPERSONATION", "OTHER"]),
  details: z.string().trim().max(1000).optional(),
});

const REASON_LABELS: Record<string, string> = {
  INAPPROPRIATE: "Inappropriate photo or profile",
  HARASSMENT: "Harassment or bullying",
  SPAM: "Spam or scam",
  IMPERSONATION: "Pretending to be someone else",
  OTHER: "Something else",
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * A member reports another member's profile (App Store guideline 1.2). The
 * report is written as the reporter, so RLS enforces same-church and
 * not-yourself; then the church's admins and Gather support are emailed so it
 * can be acted on within 24 hours.
 */
export async function POST(req: Request) {
  const caller = await getRequestUser(req);
  if (!caller) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid report." }, { status: 400 });
  const { reportedUserId, reason, details } = parsed.data;

  const { data: me } = await caller.supabase
    .from("profiles")
    .select("church_id, full_name")
    .eq("id", caller.user.id)
    .maybeSingle();
  const churchId = (me as { church_id: string | null } | null)?.church_id;
  if (!churchId) return NextResponse.json({ error: "Join a church first." }, { status: 400 });

  const { error } = await caller.supabase.from("content_reports").insert({
    church_id: churchId,
    reporter_id: caller.user.id,
    reported_user_id: reportedUserId,
    reason,
    details: details || null,
  });
  if (error) return NextResponse.json({ error: "We couldn't send that report." }, { status: 400 });

  try {
    const admin = createSupabaseAdminClient() as any;
    const [{ data: reported }, { data: admins }] = await Promise.all([
      admin.from("profiles").select("full_name, email").eq("id", reportedUserId).maybeSingle(),
      admin.from("profiles").select("email").eq("church_id", churchId).eq("role", "ADMIN").eq("disabled", false),
    ]);
    const who = esc(reported?.full_name || reported?.email || "a member");
    const html = `
      <div style="font-family:Arial,sans-serif;color:#1c1209;line-height:1.6">
        <p>A member reported <strong>${who}</strong>'s profile in Gather.</p>
        <p><strong>Reason:</strong> ${esc(REASON_LABELS[reason])}</p>
        ${details ? `<p><strong>Details:</strong> ${esc(details)}</p>` : ""}
        <p>Review it under People → Reports. If the profile breaks your church's standards, you can disable the account there.</p>
      </div>`;
    const recipients = [
      ...new Set([...((admins ?? []) as { email: string | null }[]).map((a) => a.email).filter(Boolean), SUPPORT_INBOX]),
    ] as string[];
    await Promise.all(recipients.map((to) => sendEmail(to, "A profile was reported in Gather", html)));
  } catch (err) {
    console.warn("[moderation/report] notify failed", err);
  }

  return NextResponse.json({ ok: true });
}
