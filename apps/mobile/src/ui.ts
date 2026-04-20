import { StyleSheet } from "react-native";
import { colors as c } from "./theme/tokens";

/** Legacy alias map — values track apps/web/app/globals.css via tokens.ts */
export const colors = {
  background: c.background,
  surface: c.surface,
  surfaceAlt: c.surface2,
  text: c.textPrimary,
  muted: c.textMuted,
  primary: c.primary,
  primaryText: c.primaryText,
  outline: c.border
};

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.background,
    padding: 20
  },
  header: {
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: c.textPrimary
  },
  subtitle: {
    marginTop: 4,
    color: c.textMuted
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12
  },
  cardAlt: {
    backgroundColor: c.surface2,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: c.textPrimary
  },
  cardValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "600",
    color: c.textPrimary
  },
  button: {
    backgroundColor: c.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 8
  },
  buttonText: {
    color: c.onPrimary,
    fontWeight: "600"
  },
  buttonGhostText: {
    color: c.textPrimary,
    fontWeight: "600"
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 8
  },
  input: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: c.textPrimary,
    marginBottom: 12,
    backgroundColor: c.primarySoft
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: c.primarySoft
  },
  badgeText: {
    fontSize: 12,
    color: c.textPrimary,
    fontWeight: "600"
  }
});
