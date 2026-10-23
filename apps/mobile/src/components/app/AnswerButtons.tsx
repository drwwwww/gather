import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { palette, font, radius } from "../ds";

/**
 * The two answers to "Can you serve?", side by side and equal in size (Planning
 * Center / shift-app pattern): a quiet "Can't make it" and the amber "I'll be there".
 * Equal weight so declining never feels like the wrong button.
 */
export default function AnswerButtons({
  onYes,
  onNo,
  busy,
  yesLabel = "I'll be there",
  noLabel = "Can't make it",
}: {
  onYes: () => void;
  onNo: () => void;
  busy?: boolean;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onNo}
        disabled={busy}
        accessibilityRole="button"
        style={({ pressed }: { pressed: boolean }) => [styles.btn, styles.no, (busy || pressed) && { opacity: busy ? 0.55 : 0.8 }]}
      >
        <Text style={styles.noTxt}>{noLabel}</Text>
      </Pressable>
      <Pressable
        onPress={onYes}
        disabled={busy}
        accessibilityRole="button"
        style={({ pressed }: { pressed: boolean }) => [styles.btn, styles.yes, (busy || pressed) && { opacity: busy ? 0.55 : 0.85 }]}
      >
        {busy ? <ActivityIndicator color="#3A2600" /> : <Text style={styles.yesTxt}>{yesLabel}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, minHeight: 46, borderRadius: radius.chip, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  no: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line },
  yes: { backgroundColor: palette.amber },
  noTxt: { fontFamily: font.semibold, fontSize: 15, color: palette.ink },
  yesTxt: { fontFamily: font.semibold, fontSize: 15, color: "#3A2600" },
});
