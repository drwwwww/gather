import { View, Text, StyleSheet } from "react-native";
import { Icon } from "../components/ui/Icon";
import { Screen, Txt, Button, palette, font } from "../components/ds";
import { supabase } from "../supabase";

export default function AccountDisabledScreen() {
  const handleSignOut = async () => { if (supabase) await supabase.auth.signOut(); };
  return (
    <Screen edges={["top", "bottom"]}>
      <View style={styles.wrap}>
        <View style={styles.icon}><Icon name="alertImportant" size={30} color={palette.danger} /></View>
        <Text style={styles.title}>Account inactive</Text>
        <Txt variant="body" color="inkSoft" center style={{ marginBottom: 32 }}>
          Your access to this church has been turned off by an administrator. Contact your church office if you think this is a mistake.
        </Txt>
        <Button label="Sign out" variant="secondary" icon="logout" onPress={handleSignOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  icon: { width: 68, height: 68, borderRadius: 22, backgroundColor: palette.dangerSoft, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 20 },
  title: { fontFamily: font.bold, fontSize: 26, color: palette.ink, textAlign: "center", letterSpacing: -0.4, marginBottom: 10 },
});
