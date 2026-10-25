import React, { useCallback, useState } from "react";
import { Text, Image, View, ScrollView, StyleSheet, Share, StatusBar, Pressable, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, GlassIconButton, palette, font, space } from "../components/ds";
import { Icon } from "../components/ui/Icon";
import BrandArt from "../components/app/BrandArt";
import { supabase } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { addToCalendar, eventAddress, eventWhen, openDirections } from "../lib/events";
import {
  ANNOUNCEMENT_COLUMNS, KIND_META, type AnnouncementRow, type Extras, closesLabel, isClosed, leaveSlot, loadExtras, normalize,
  relativeLabel, setPraying, setRsvp, slotTotals, takeSlot,
} from "../lib/announcements";

type Params = { id?: string; title?: string; body?: string; message?: string; publish_at?: string | null; date?: string; image_url?: string | null };
type Person = { id: string; full_name: string | null; email: string | null; avatar_url: string | null; role: string };

const DAY = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

/**
 * An announcement reads like an article (Apple News / Substack) and, depending on
 * its type, works like the real thing:
 *  - Event (Ticketmaster): date and place rows with Add to calendar / Directions,
 *    who's going, and an "I'm going" bar at the bottom.
 *  - Sign-up (ParentSquare / SignUpGenius): slots to take, progress, and a note
 *    that only shows once you've signed up.
 *  - Prayer: "I'm praying" with a count.
 * Any type can carry "Know before you go" and a person to ask. The web composer's
 * preview (AnnouncementBrowser → AppAnnouncementPreview) mirrors this — keep in step.
 */
export default function AnnouncementsDetailScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const p = route.params?.announcement as Params | undefined;
  const id = p?.id;
  const [a, setA] = useState<AnnouncementRow | null>(
    p ? normalize({ id: id ?? "", title: p.title ?? "News", body: p.body ?? p.message ?? "", publish_at: p.publish_at ?? p.date ?? null, created_at: p.publish_at ?? new Date().toISOString(), image_url: p.image_url ?? null }) : null
  );
  const [x, setX] = useState<Extras | null>(null);
  const [church, setChurch] = useState<{ name: string; address: string | null } | null>(null);
  const [contact, setContact] = useState<Person | null>(null);
  const [privateNote, setPrivateNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const me = user?.id ?? "";

  const load = useCallback(async () => {
    if (!supabase || !id || !profile?.church_id) return;
    const [rowRes, churchRes] = await Promise.all([
      supabase.from("announcements").select(ANNOUNCEMENT_COLUMNS).eq("id", id).maybeSingle(),
      supabase.from("churches").select("name, address").eq("id", profile.church_id).maybeSingle(),
    ]);
    setChurch((churchRes.data as { name: string; address: string | null } | null) ?? null);
    if (!rowRes.data) return;
    const row = normalize(rowRes.data);
    setA(row);
    const [extras, contactRes, noteRes] = await Promise.all([
      loadExtras(supabase, [row], me),
      row.contact_user_id ? supabase.from("profiles").select("id, full_name, email, avatar_url, role").eq("id", row.contact_user_id).maybeSingle() : Promise.resolve({ data: null }),
      row.kind === "SIGNUP" ? (supabase as any).from("announcement_private").select("note").eq("announcement_id", row.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setX(extras);
    setContact((contactRes.data as Person | null) ?? null);
    setPrivateNote((noteRes.data as { note: string } | null)?.note?.trim() || null);
  }, [id, profile?.church_id, me]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (!a) return null;
  const meta = KIND_META[a.kind];
  const ev = a.kind === "EVENT" && a.event_id && x ? x.events[a.event_id] : undefined;
  const evAddress = ev ? eventAddress(ev, church?.address) : null;
  const upcomingEvent = !!ev && !ev.is_cancelled && new Date(ev.end_at ?? ev.start_at) > new Date();
  const slots = x?.slots[a.id] ?? [];
  const totals = slotTotals(slots, me);
  const closed = isClosed(a);

  const run = async (key: string, fn: () => Promise<string | null>) => {
    if (busy) return;
    setBusy(key); setError(null);
    const err = await fn();
    setBusy(null);
    if (err) { setError(err); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}); return; }
    Haptics.selectionAsync().catch(() => {});
    await load();
  };

  const share = async () => {
    const when = ev ? `\n${eventWhen(ev).dateLine} · ${eventWhen(ev).timeLine}` : "";
    try { await Share.share({ message: `${a.title}${when}\n\n${a.body}` }); } catch { /* dismissed */ }
  };

  const calendar = async () => {
    if (!ev) return;
    try { await addToCalendar(ev, evAddress); }
    catch (e) { setError(e instanceof Error ? e.message : "Couldn't open your calendar."); }
  };

  // Bottom action bar: only for the types that have one main thing to do.
  const myRsvp = ev && x ? x.myRsvp[ev.id] : undefined;
  const bar = ev && upcomingEvent ? (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.barSub}>{(x?.going[ev.id] ?? 0)} going{x?.maybe[ev.id] ? ` · ${x.maybe[ev.id]} maybe` : ""}</Text>
        <Text style={styles.barMain}>{myRsvp === "GOING" ? "You're going" : myRsvp === "MAYBE" ? "You might go" : myRsvp === "NO" ? "You're not going" : "Are you coming?"}</Text>
      </View>
      {myRsvp === "GOING" ? (
        <Pressable onPress={() => void run("rsvp", () => setRsvp(supabase, ev.id, me, "NO"))} accessibilityRole="button" style={styles.barQuiet}>
          <Text style={styles.barQuietTxt}>Can't go</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => void run("rsvp", () => setRsvp(supabase, ev.id, me, "GOING"))} accessibilityRole="button" style={({ pressed }: { pressed: boolean }) => [styles.barAmber, pressed && { opacity: 0.85 }]}>
          {busy === "rsvp" ? <ActivityIndicator color="#3A2600" /> : <Text style={styles.barAmberTxt}>I'm going</Text>}
        </Pressable>
      )}
    </View>
  ) : a.kind === "SIGNUP" && totals.mine ? (
    <View style={[styles.bar, { paddingBottom: insets.bottom + 12 }]}>
      <Icon name="checkCircle" size={20} color={palette.successInk} />
      <Text style={[styles.barMain, { flex: 1 }]}>You signed up: {totals.mine.label}</Text>
    </View>
  ) : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bar ? 24 : insets.bottom + space.xxl }}>
        {a.image_url ? (
          // The box takes the 3:2 shape and the photo fills it. On a phone, an Image sized
          // by aspectRatio alone can fall back to the photo's own pixel size (1800×1197)
          // and fill most of the screen; a View always honours aspectRatio.
          <View style={styles.hero}>
            <Image source={{ uri: a.image_url }} style={[StyleSheet.absoluteFill as any, styles.fill]} resizeMode="cover" accessibilityIgnoresInvertColors />
          </View>
        ) : (
          <BrandArt seed={a.id || a.title} style={styles.hero} />
        )}
        <View style={styles.content}>
          <View style={styles.metaRow}>
            <View style={[styles.tag, { backgroundColor: meta.area.tint }]}><Text style={[styles.tagTxt, { color: meta.area.ink }]}>{meta.label}</Text></View>
            {a.important ? <View style={[styles.tag, { backgroundColor: "#FDF0D5" }]}><Text style={[styles.tagTxt, { color: "#7A4508" }]}>Important</Text></View> : null}
            {a.kind === "SIGNUP" && a.closes_at ? (
              <Text style={[styles.when, !closed && { color: palette.amberInk, fontFamily: font.semibold }]}>{closesLabel(a.closes_at)}</Text>
            ) : (
              <Text style={styles.when}>{relativeLabel(a.publish_at, a.created_at)}</Text>
            )}
          </View>
          <Text style={styles.title} accessibilityRole="header">{a.title}</Text>
          <View style={styles.byline}>
            <Icon name="church" size={15} color={palette.inkMuted} />
            <Text style={styles.bylineTxt} numberOfLines={1}>{church?.name ?? "Your church"}</Text>
          </View>

          {/* Event: when and where */}
          {ev ? (
            <View style={styles.box}>
              <View style={styles.infoRow}>
                <View style={[styles.dateTile, { backgroundColor: meta.area.tint }]}>
                  <Text style={[styles.dateMon, { color: meta.area.ink }]}>{new Date(ev.start_at).toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</Text>
                  <Text style={[styles.dateDay, { color: meta.area.ink }]}>{new Date(ev.start_at).getDate()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoMain}>{ev.is_cancelled ? "Cancelled" : eventWhen(ev).dateLine}</Text>
                  <Text style={styles.infoSub}>{eventWhen(ev).timeLine}</Text>
                </View>
                {upcomingEvent ? (
                  <Pressable onPress={() => void calendar()} accessibilityRole="button" hitSlop={8} style={styles.inline}><Text style={styles.link}>Add to calendar</Text></Pressable>
                ) : null}
              </View>
              {ev.location || evAddress ? (
                <>
                  <View style={styles.rule} />
                  <View style={styles.infoRow}>
                    <View style={styles.iconTile}><Icon name="mapPin" size={20} color={palette.inkSoft} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoMain}>{ev.location || church?.name || "Location"}</Text>
                      {evAddress ? <Text style={styles.infoSub}>{evAddress}</Text> : null}
                    </View>
                    {evAddress ? (
                      <Pressable onPress={() => void openDirections(evAddress, ev.location ?? undefined)} accessibilityRole="button" hitSlop={8} style={styles.inline}><Text style={styles.link}>Directions</Text></Pressable>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}

          {a.body ? (
            <>
              {ev || a.kind === "SIGNUP" ? <Text style={styles.section} accessibilityRole="header">About</Text> : <View style={styles.hair} />}
              <Text style={styles.body} selectable>{a.body}</Text>
            </>
          ) : null}

          {/* Prayer */}
          {a.kind === "PRAYER" && x ? (
            <Pressable
              onPress={() => void run("pray", () => setPraying(supabase, a.id, profile!.church_id!, me, !x.iPray.has(a.id)))}
              accessibilityRole="button"
              aria-pressed={x.iPray.has(a.id)}
              style={({ pressed }: { pressed: boolean }) => [styles.pray, x.iPray.has(a.id) && { backgroundColor: meta.area.tint, borderColor: meta.area.tint }, pressed && { opacity: 0.85 }]}
            >
              <Icon name="pray" size={20} color={meta.area.ink} />
              <Text style={[styles.prayTxt, { color: x.iPray.has(a.id) ? meta.area.ink : palette.ink }]}>
                {x.iPray.has(a.id) ? "You're praying" : "I'm praying"} · {x.praying[a.id] ?? 0}
              </Text>
            </Pressable>
          ) : null}

          {/* Sign-up slots */}
          {a.kind === "SIGNUP" ? (
            <>
              <View style={styles.sectionRow}>
                <Text style={styles.sectionInline} accessibilityRole="header">{closed ? "Sign-ups" : totals.mine ? "Your slot" : "Pick a slot"}</Text>
                <Text style={styles.infoSub}>{totals.taken} of {totals.capacity} taken</Text>
              </View>
              <View style={styles.progress}><View style={[styles.progressFill, { width: `${totals.capacity ? (totals.taken / totals.capacity) * 100 : 0}%` }]} /></View>
              <View style={[styles.box, { marginTop: 14 }]}>
                {slots.map((s, i) => {
                  const mineHere = s.takers.some((t) => t.userId === me);
                  const full = s.takers.length >= s.capacity;
                  const who = s.takers.filter((t) => t.userId !== me).map((t) => t.name.split(" ")[0]);
                  return (
                    <View key={s.id}>
                      {i > 0 ? <View style={[styles.rule, { marginLeft: 16 }]} /> : null}
                      <View style={[styles.slotRow, mineHere && { backgroundColor: "#FFF8EB" }]}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.infoMain}>{s.label}</Text>
                          <Text style={styles.infoSub}>
                            {[mineHere ? "You" : null, ...who].filter(Boolean).join(", ") || (s.detail ?? "Open")}
                            {s.capacity > 1 ? ` · ${s.takers.length}/${s.capacity}` : ""}
                          </Text>
                          {s.detail && (mineHere || who.length) ? <Text style={styles.slotDetail}>{s.detail}</Text> : null}
                        </View>
                        {mineHere ? (
                          closed ? null : (
                            <Pressable onPress={() => void run(s.id, () => leaveSlot(supabase, s.id))} accessibilityRole="button" accessibilityLabel={`Leave ${s.label}`} style={styles.slotQuiet}>
                              <Text style={styles.slotQuietTxt}>{busy === s.id ? "…" : "Leave"}</Text>
                            </Pressable>
                          )
                        ) : full ? (
                          <Icon name="check" size={20} color={KIND_META.SIGNUP.area.ink} />
                        ) : closed ? null : (
                          <Pressable onPress={() => void run(s.id, () => takeSlot(supabase, s.id))} accessibilityRole="button" accessibilityLabel={`Take ${s.label}`} style={({ pressed }: { pressed: boolean }) => [styles.slotTake, pressed && { opacity: 0.85 }]}>
                            {busy === s.id ? <ActivityIndicator color={palette.onDark} size="small" /> : <Text style={styles.slotTakeTxt}>{totals.mine ? "Switch" : "Take it"}</Text>}
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
              {privateNote ? (
                <View style={styles.privateNote}>
                  <Icon name="info" size={18} color={KIND_META.SIGNUP.area.ink} />
                  <Text style={styles.privateNoteTxt}>{privateNote}</Text>
                </View>
              ) : totals.mine ? null : (
                <Text style={[styles.infoSub, { marginTop: 10 }]}>Details like the address are shared once you sign up.</Text>
              )}
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Know before you go */}
          {a.info.length > 0 ? (
            <>
              <Text style={styles.section} accessibilityRole="header">Know before you go</Text>
              <View style={styles.box}>
                {a.info.map((it, i) => (
                  <View key={i}>
                    {i > 0 ? <View style={[styles.rule, { marginLeft: 16 }]} /> : null}
                    <View style={[styles.infoRow, { alignItems: "flex-start" }]}>
                      <View style={{ flex: 1 }}>
                        {it.label ? <Text style={styles.infoMain}>{it.label}</Text> : null}
                        {it.text ? <Text style={styles.infoSub}>{it.text}</Text> : null}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* Who to ask */}
          {contact ? (
            <>
              <Text style={styles.section} accessibilityRole="header">Questions?</Text>
              <View style={styles.contact}>
                <Avatar name={contact.full_name} email={contact.email} imageUri={contact.avatar_url} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoMain}>{contact.full_name?.trim() || "Church contact"}</Text>
                  <Text style={styles.infoSub}>{contact.role === "ADMIN" ? "Church staff" : contact.role === "SERVICE" ? "Service team" : "Member"}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + 6 }]} pointerEvents="box-none">
        <GlassIconButton icon="chevronLeft" onPress={() => navigation.goBack()} size={40} iconSize={22} accessibilityLabel="Back" />
        <GlassIconButton icon="share" onPress={() => void share()} size={40} iconSize={19} accessibilityLabel="Share" />
      </View>
      {bar}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  hero: { width: "100%", aspectRatio: 3 / 2, backgroundColor: palette.sunken },
  fill: { width: "100%", height: "100%" },
  content: { paddingHorizontal: space.gutter, paddingTop: space.lg },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  tag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagTxt: { fontFamily: font.semibold, fontSize: 12 },
  when: { fontFamily: font.medium, fontSize: 13, color: palette.inkSoft },
  title: { fontFamily: font.bold, fontSize: 28, lineHeight: 34, letterSpacing: -0.5, color: palette.ink, marginTop: 12 },
  byline: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
  bylineTxt: { fontFamily: font.medium, fontSize: 14, color: palette.inkSoft, flexShrink: 1 },
  hair: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line, marginVertical: space.lg },
  body: { fontFamily: font.regular, fontSize: 17, lineHeight: 27, color: palette.ink },
  section: { fontFamily: font.bold, fontSize: 18, color: palette.ink, marginTop: 26, marginBottom: 10 },
  sectionRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 26 },
  sectionInline: { fontFamily: font.bold, fontSize: 18, color: palette.ink },

  box: { marginTop: 18, borderWidth: 1, borderColor: palette.line, borderRadius: 16, overflow: "hidden" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  infoMain: { fontFamily: font.semibold, fontSize: 15, color: palette.ink },
  infoSub: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft, marginTop: 2 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: palette.line, marginLeft: 74 },
  inline: { minHeight: 44, justifyContent: "center" },
  link: { fontFamily: font.semibold, fontSize: 14, color: palette.amberInk },
  dateTile: { width: 44, height: 48, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dateMon: { fontFamily: font.bold, fontSize: 10, letterSpacing: 0.6 },
  dateDay: { fontFamily: font.bold, fontSize: 18, lineHeight: 20 },
  iconTile: { width: 44, height: 44, borderRadius: 10, backgroundColor: palette.sunken, alignItems: "center", justifyContent: "center" },

  pray: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", minHeight: 48, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: palette.line, marginTop: 20 },
  prayTxt: { fontFamily: font.semibold, fontSize: 15 },

  progress: { height: 6, borderRadius: 3, backgroundColor: palette.lineSoft, marginTop: 10, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: "#009B90" },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 64 },
  slotDetail: { fontFamily: font.regular, fontSize: 13, color: palette.inkMuted, marginTop: 2 },
  slotTake: { minHeight: 40, minWidth: 76, paddingHorizontal: 14, borderRadius: 10, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  slotTakeTxt: { fontFamily: font.semibold, fontSize: 14, color: palette.onDark },
  slotQuiet: { minHeight: 40, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: palette.line, justifyContent: "center" },
  slotQuietTxt: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft },
  privateNote: { flexDirection: "row", gap: 10, backgroundColor: "#E0F2EF", borderRadius: 14, padding: 14, marginTop: 14 },
  privateNoteTxt: { flex: 1, fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: "#0B5E57" },

  contact: { flexDirection: "row", alignItems: "center", gap: 12 },
  error: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, marginTop: 14 },

  topBar: { position: "absolute", left: space.base, right: space.base, flexDirection: "row", justifyContent: "space-between" },
  bar: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line, backgroundColor: palette.surface, paddingHorizontal: space.gutter, paddingTop: 12 },
  barSub: { fontFamily: font.regular, fontSize: 13, color: palette.inkSoft },
  barMain: { fontFamily: font.semibold, fontSize: 15, color: palette.ink },
  barAmber: { minHeight: 48, minWidth: 120, paddingHorizontal: 22, borderRadius: 14, backgroundColor: palette.amber, alignItems: "center", justifyContent: "center" },
  barAmberTxt: { fontFamily: font.semibold, fontSize: 16, color: "#3A2600" },
  barQuiet: { minHeight: 48, paddingHorizontal: 18, borderRadius: 14, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  barQuietTxt: { fontFamily: font.semibold, fontSize: 15, color: palette.inkSoft },
});
