import { supabase } from "../supabase";

/** IDs of members the signed-in user has blocked (RLS returns only their own rows). */
export async function loadBlockedIds(): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data } = await supabase.from("user_blocks").select("blocked_id");
  return new Set(((data ?? []) as { blocked_id: string }[]).map((r) => r.blocked_id));
}

export async function setBlocked(blockerId: string, blockedId: string, blocked: boolean): Promise<boolean> {
  if (!supabase) return false;
  const { error } = blocked
    ? await supabase.from("user_blocks").upsert({ blocker_id: blockerId, blocked_id: blockedId } as any)
    : await supabase.from("user_blocks").delete().eq("blocker_id", blockerId).eq("blocked_id", blockedId);
  return !error;
}
