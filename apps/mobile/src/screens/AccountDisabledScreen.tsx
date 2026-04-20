import { View, Text } from "react-native";
import { AppShell } from "../components/app/AppShell";
import { GatherMark } from "../components/app/GatherMark";
import { StitchHero } from "../components/app/StitchStackChrome";
import { GradientButton } from "../components/ui/GradientButton";
import { theme } from "../theme/theme";
import { STITCH_PAD_H } from "../theme/stitch";
import { supabase } from "../supabase";

export default function AccountDisabledScreen() {
  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AppShell>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: STITCH_PAD_H }}>
        <View style={{ alignItems: "center", marginBottom: theme.spacing.lg }}>
          <GatherMark layout="stacked" />
        </View>
        <StitchHero
          title="Account inactive"
          subtitle="Your access to this church has been turned off by an administrator. Contact your church office if you think this is a mistake."
          marginBottom={theme.spacing.xl}
        />
        <GradientButton onPress={handleSignOut}>Sign out</GradientButton>
      </View>
    </AppShell>
  );
}
