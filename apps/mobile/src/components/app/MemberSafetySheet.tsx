import { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../ui/Icon";
import { Avatar, Button, palette, font, radius, space } from "../ds";
import { postWebApi } from "../../lib/webApi";

export type SafetyMember = { id: string; full_name: string | null; email: string | null };

const REASONS = [
  { key: "INAPPROPRIATE", label: "Inappropriate photo or profile" },
  { key: "HARASSMENT", label: "Harassment or bullying" },
  { key: "SPAM", label: "Spam or scam" },
  { key: "IMPERSONATION", label: "Pretending to be someone else" },
  { key: "OTHER", label: "Something else" },
] as const;

type Step = "menu" | "report" | "sent";

/**
 * Report / block for another member (App Store guideline 1.2 — apps that show
 * other people's profiles need both). Blocking is instant and local to the
 * blocker; reporting notifies the church's admins and Gather support.
 */
export function MemberSafetySheet({
  member,
  isBlocked,
  onClose,
  onToggleBlock,
}: {
  member: SafetyMember | null;
  isBlocked: boolean;
  onClose: () => void;
  onToggleBlock: (member: SafetyMember) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("menu");
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (member) { setStep("menu"); setReason(null); setDetails(""); setError(null); setBusy(false); }
  }, [member?.id]);

  if (!member) return null;
  const name = member.full_name?.trim() || member.email?.split("@")[0] || "this member";

  const submitReport = async () => {
    if (!reason || busy) return;
    setBusy(true);
    setError(null);
    const res = await postWebApi("/api/moderation/report", {
      reportedUserId: member.id,
      reason,
      details: details.trim() || undefined,
    });
    setBusy(false);
    if (!res.ok) { setError(res.data.error ?? "We couldn't send that report."); return; }
    setStep("sent");
  };

  const toggleBlock = async () => {
    setBusy(true);
    await onToggleBlock(member);
    setBusy(false);
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.anchor} pointerEvents="box-none">
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          <View style={styles.grabber} />

          <View style={styles.head}>
            <Avatar name={member.full_name} email={member.email} seed={member.id} size={44} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name} numberOfLines={1}>{name}</Text>
              {member.email ? <Text style={styles.sub} numberOfLines={1}>{member.email}</Text> : null}
            </View>
          </View>

          {step === "menu" && (
            <View style={styles.list}>
              <SheetRow icon="flag" label="Report profile" hint="Your church's admins will review it" onPress={() => setStep("report")} />
              <SheetRow
                icon="block"
                label={isBlocked ? "Unblock" : "Block"}
                hint={isBlocked ? "They'll appear in your directory again" : "Hide them from your directory and search"}
                onPress={toggleBlock}
                danger={!isBlocked}
              />
            </View>
          )}

          {step === "report" && (
            <View>
              <Text style={styles.prompt}>Why are you reporting {name}?</Text>
              <View style={{ gap: 8 }}>
                {REASONS.map((r) => {
                  const on = reason === r.key;
                  return (
                    <Pressable
                      key={r.key}
                      onPress={() => setReason(r.key)}
                      style={[styles.reason, on && styles.reasonOn]}
                      accessibilityRole="radio"
                      aria-checked={on}
                    >
                      <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                      <Text style={styles.reasonTxt}>{r.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Anything else admins should know? (optional)"
                placeholderTextColor={palette.inkMuted}
                multiline
                maxLength={1000}
                style={styles.details}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Button label="Send report" onPress={submitReport} disabled={!reason} loading={busy} style={{ marginTop: 14 }} />
            </View>
          )}

          {step === "sent" && (
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <View style={styles.sentIcon}><Icon name="check" size={24} color={palette.amberInk} /></View>
              <Text style={styles.sentTitle}>Thanks for letting us know</Text>
              <Text style={styles.sentBody}>
                Your church's admins have been notified and will review this. Your report is private — {name} won't see who sent it.
              </Text>
              {!isBlocked ? (
                <Button label={`Also block ${name}`} variant="secondary" icon="block" onPress={toggleBlock} loading={busy} style={{ marginTop: 18 }} />
              ) : null}
              <Button label="Done" variant="ghost" onPress={onClose} style={{ marginTop: 10 }} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SheetRow({
  icon, label, hint, onPress, danger,
}: { icon: any; label: string; hint: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }: { pressed: boolean }) => [styles.row, pressed && { backgroundColor: palette.sunken }]} accessibilityRole="button">
      <View style={[styles.rowIcon, danger && { backgroundColor: palette.dangerSoft }]}>
        <Icon name={icon} size={19} color={danger ? palette.danger : palette.inkSoft} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: palette.danger }]}>{label}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(21,10,0,0.45)" },
  anchor: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: palette.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: space.gutter, paddingTop: 10,
  },
  grabber: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: palette.line, marginBottom: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  name: { fontFamily: font.bold, fontSize: 17, color: palette.ink },
  sub: { fontFamily: font.regular, fontSize: 13, color: palette.inkMuted, marginTop: 2 },
  list: { borderRadius: radius.lg, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: palette.line },
  row: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, minHeight: 64 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: palette.sunken, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontFamily: font.semibold, fontSize: 15, color: palette.ink },
  rowHint: { fontFamily: font.regular, fontSize: 12, color: palette.inkMuted, marginTop: 2 },
  prompt: { fontFamily: font.semibold, fontSize: 15, color: palette.ink, marginBottom: 12 },
  reason: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, minHeight: 48,
    borderRadius: radius.lg, borderWidth: 1.5, borderColor: palette.line,
  },
  reasonOn: { borderColor: palette.amber, backgroundColor: palette.amberSofter },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: palette.inkMuted, alignItems: "center", justifyContent: "center" },
  radioOn: { borderColor: palette.amberInk },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: palette.amberInk },
  reasonTxt: { fontFamily: font.medium, fontSize: 14, color: palette.ink, flex: 1 },
  details: {
    marginTop: 12, minHeight: 72, borderRadius: radius.lg, borderWidth: 1.5, borderColor: palette.line,
    padding: 12, fontFamily: font.regular, fontSize: 14, color: palette.ink, textAlignVertical: "top",
  },
  error: { fontFamily: font.medium, fontSize: 13, color: palette.dangerInk, marginTop: 10 },
  sentIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: palette.amberSofter, alignItems: "center", justifyContent: "center" },
  sentTitle: { fontFamily: font.bold, fontSize: 18, color: palette.ink, marginTop: 14 },
  sentBody: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: palette.inkSoft, textAlign: "center", marginTop: 8 },
});
