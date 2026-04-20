import { Text, ScrollView } from "react-native";
import { AppShell } from "../components/app/AppShell";
import { StitchStackBackRow, StitchHero } from "../components/app/StitchStackChrome";
import { theme } from "../theme/theme";
import { STITCH_PAD_H, stitchFilledCard } from "../theme/stitch";

export default function FeaturePlaceholderScreen({ navigation, route }: any) {
  const title = route.params?.title ?? "Coming soon";
  const subtitle =
    route.params?.subtitle ??
    "This area is not available in the app yet. Use the web dashboard for full church management tools.";

  return (
    <AppShell>
      <StitchStackBackRow navigation={navigation} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: STITCH_PAD_H }}>
        <StitchHero title={title} />
        <View style={stitchFilledCard()}>
          <Text style={{ fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSize.md, lineHeight: 24, color: theme.colors.textSecondary }}>{subtitle}</Text>
        </View>
      </ScrollView>
    </AppShell>
  );
}
