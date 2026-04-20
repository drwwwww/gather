import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { GatherMark } from "./GatherMark";
import { ProfileMenuAvatar } from "./ScreenTopBar";
import { theme } from "../../theme/theme";

type Nav = { navigate: (name: string, params?: object) => void };

export type StitchTabAppBarProps = {
  navigation: Nav;
  /** Defaults to profile avatar → ProfileMenu. */
  rightAccessory?: ReactNode;
};

/**
 * Sticky-style top row from Stitch tab screens (`screen-10-serve.html`):
 * flat Gather mark + right accessory (usually profile).
 */
export function StitchTabAppBar({ navigation, rightAccessory }: StitchTabAppBarProps) {
  return (
    <View style={styles.wrap}>
      <GatherMark layout="row" flat />
      {rightAccessory ?? <ProfileMenuAvatar navigation={navigation} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: theme.colors.background,
  },
});
