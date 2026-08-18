import { ScrollView } from "react-native";
import { Screen, AppBar, EmptyState, space } from "../components/ds";

export default function FeaturePlaceholderScreen({ navigation, route }: any) {
  const title = route.params?.title ?? "Coming soon";
  const subtitle =
    route.params?.subtitle ??
    "This area is not available in the app yet. Use the web dashboard for full church management tools.";

  return (
    <Screen>
      <AppBar title={title} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 40, paddingBottom: 60 }}>
        <EmptyState icon="sparkle" title={title} body={subtitle} />
      </ScrollView>
    </Screen>
  );
}
