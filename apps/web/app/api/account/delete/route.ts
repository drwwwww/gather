import { NextResponse } from "next/server";
import { getRequestUser } from "../../../../lib/apiAuth";
import { createSupabaseAdminClient } from "../../../../lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Permanently deletes the signed-in user's account (App Store guideline
 * 5.1.1(v) / Google Play account-deletion policy). Called by mobile with a
 * bearer token and by web with session cookies.
 *
 * Order matters: hand off serving slots and guard the last-admin case
 * (prepare_account_deletion), remove their uploaded photos, then delete the
 * auth user — every public table cascades or nulls from auth.users.
 */
export async function POST(req: Request) {
  const caller = await getRequestUser(req);
  if (!caller) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "DELETE") {
    return NextResponse.json({ error: "Confirmation missing." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient() as any;
  const userId = caller.user.id;

  const { error: prepError } = await admin.rpc("prepare_account_deletion", { p_user_id: userId });
  if (prepError) {
    if (String(prepError.message).includes("LAST_ADMIN")) {
      return NextResponse.json(
        {
          error:
            "You're the only admin of your church. Make someone else an admin in People first, then delete your account.",
          code: "LAST_ADMIN",
        },
        { status: 409 }
      );
    }
    console.error("[account/delete] prepare failed", prepError);
    return NextResponse.json({ error: "We couldn't delete your account. Please try again." }, { status: 500 });
  }

  // Avatars live under `<user_id>/…`. Best-effort: a storage hiccup must not
  // leave the person unable to delete their account.
  try {
    const { data: files } = await admin.storage.from("avatars").list(userId, { limit: 1000 });
    const paths = ((files ?? []) as { name: string }[]).map((f) => `${userId}/${f.name}`);
    if (paths.length > 0) await admin.storage.from("avatars").remove(paths);
  } catch (err) {
    console.warn("[account/delete] avatar cleanup failed", err);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("[account/delete] deleteUser failed", deleteError);
    return NextResponse.json({ error: "We couldn't delete your account. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
