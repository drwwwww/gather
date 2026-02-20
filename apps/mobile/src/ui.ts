import { StyleSheet } from "react-native";

export const colors = {
  background: "#F6F2E6",
  surface: "#EFE1C9",
  surfaceAlt: "#E6D3B5",
  text: "#2B241C",
  muted: "#7B735D",
  primary: "#F0CA8F",
  primaryText: "#2B241C",
  outline: "#D9C9AE"
};

export const ui = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20
  },
  header: {
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12
  },
  cardAlt: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  cardValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: "600",
    color: colors.text
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 8
  },
  buttonText: {
    color: colors.primaryText,
    fontWeight: "600"
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    marginTop: 8
  },
  input: {
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    marginBottom: 12,
    backgroundColor: "#FFF8EB"
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
    backgroundColor: "#F9E2B6"
  },
  badgeText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "600"
  }
});
