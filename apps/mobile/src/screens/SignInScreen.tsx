import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Button } from "../components/ui/Button";
import { GradientButton } from "../components/ui/GradientButton";
import { AppShell } from "../components/app/AppShell";
import { GatherMark } from "../components/app/GatherMark";
import { theme } from "../theme/theme";
import { supabase } from "../supabase";

const inputStyle = {
  width: "100%" as const,
  paddingHorizontal: theme.spacing.lg,
  paddingVertical: 16,
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radii.lg,
  fontSize: theme.typography.fontSize.md,
  color: theme.colors.primaryText,
  fontFamily: theme.typography.fontFamily,
};

export default function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!supabase) return;
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return;
    }
  };

  return (
    <AppShell>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.xl,
            paddingBottom: theme.spacing.xl * 2,
            justifyContent: "center",
          }}
        >
          <GatherMark layout="stacked" />

          <View style={{ marginBottom: 40 }}>
            <Text
              style={{
                fontFamily: theme.typography.fontFamily,
                fontSize: 56,
                fontWeight: theme.typography.fontWeight.bold as any,
                color: theme.colors.primaryText,
                letterSpacing: -0.5,
                lineHeight: 62,
                marginBottom: 8,
              }}
            >
              Welcome back
            </Text>
            <Text
              style={{
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.fontSize.lg,
                color: theme.colors.textSecondary,
                lineHeight: 26,
                maxWidth: 320,
              }}
            >
              Step back into the sanctuary. Your community is waiting.
            </Text>
          </View>

          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium as any,
                color: theme.colors.textSecondary,
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              Email Address
            </Text>
            <TextInput
              placeholder="yourname@domain.com"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              style={inputStyle}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={{ marginBottom: theme.spacing.md }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                paddingLeft: 4,
                paddingRight: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.typography.fontFamily,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium as any,
                  color: theme.colors.textSecondary,
                }}
              >
                Password
              </Text>
              <TouchableOpacity onPress={() => {}} accessibilityRole="button">
                <Text
                  style={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: theme.typography.fontSize.sm,
                    fontWeight: theme.typography.fontWeight.medium as any,
                    color: theme.colors.primary,
                  }}
                >
                  Forgot?
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ position: "relative" }}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={[inputStyle, { paddingRight: 52 }]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={{ position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" }}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Text style={{ fontSize: 13, color: theme.colors.textSecondary, fontWeight: "600" }}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <Text
              style={{
                color: theme.colors.error,
                marginBottom: theme.spacing.md,
                fontFamily: theme.typography.fontFamily,
              }}
            >
              {error}
            </Text>
          ) : null}

          <GradientButton onPress={handleSignIn}>Sign In</GradientButton>

          <View style={{ marginTop: theme.spacing.xl, alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: theme.spacing.lg,
                width: "100%",
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
              <Text
                style={{
                  marginHorizontal: theme.spacing.md,
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 11,
                  color: theme.colors.textMuted,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontWeight: theme.typography.fontWeight.semibold as any,
                }}
              >
                Or join with
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
            </View>
            <View style={{ flexDirection: "row", gap: theme.spacing.md, width: "100%" }}>
              <View style={{ flex: 1, opacity: 0.45 }}>
                <Button variant="secondary" onPress={() => {}}>
                  Google
                </Button>
              </View>
              <View style={{ flex: 1, opacity: 0.45 }}>
                <Button variant="secondary" onPress={() => {}}>
                  Apple
                </Button>
              </View>
            </View>
            <Text
              style={{
                marginTop: theme.spacing.lg,
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.textSecondary,
                textAlign: "center",
              }}
            >
              {"Don't have an account? "}
              <Text
                onPress={() => navigation.replace("SignUp")}
                style={{ color: theme.colors.primary, fontWeight: theme.typography.fontWeight.bold as any }}
              >
                Sign up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}
