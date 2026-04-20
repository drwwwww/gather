import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { AppShell } from "../components/app/AppShell";
import { GatherMark } from "../components/app/GatherMark";
import { StitchStackBackRow, StitchHero } from "../components/app/StitchStackChrome";
import { GradientButton } from "../components/ui/GradientButton";
import { theme } from "../theme/theme";
import { STITCH_PAD_H, stitchTextField } from "../theme/stitch";
import { supabase } from "../supabase";

export default function SignUpScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    const user = data.user;
    if (user) {
      setLoading(false);
      return;
    }
    setError("Check your email to confirm your account, then sign in.");
    setLoading(false);
  };

  return (
    <AppShell>
      <StitchStackBackRow navigation={navigation} rightAccessory={null} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: STITCH_PAD_H,
            paddingBottom: theme.spacing.xl * 2,
            paddingTop: theme.spacing.sm,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <GatherMark layout="stacked" />

          <StitchHero
            title="Create your account"
            subtitle="Create your member account to join your church."
            marginBottom={theme.spacing.lg}
          />

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
            Full name
          </Text>
          <TextInput
            placeholder="Your name"
            placeholderTextColor={theme.colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
            style={[stitchTextField, { marginBottom: theme.spacing.md }]}
          />

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
            style={[stitchTextField, { marginBottom: theme.spacing.md }]}
            autoCapitalize="none"
            keyboardType="email-address"
          />

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
            Password
          </Text>
          <TextInput
            placeholder="••••••••"
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={[stitchTextField, { marginBottom: theme.spacing.md }]}
          />

          {error ? (
            <Text
              style={{
                color: theme.colors.error,
                marginBottom: theme.spacing.md,
                textAlign: "center",
                fontFamily: theme.typography.fontFamily,
              }}
            >
              {error.includes("Supabase") && error.includes("key")
                ? "Something went wrong. Please try again later."
                : error}
            </Text>
          ) : null}

          <GradientButton onPress={handleSignUp} disabled={loading}>
            {loading ? "Creating…" : "Sign up"}
          </GradientButton>

          <View
            style={{
              marginTop: theme.spacing.lg,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Text
              style={{
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.textSecondary,
              }}
            >
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.replace("SignIn")}>
              <Text
                style={{
                  fontFamily: theme.typography.fontFamily,
                  fontSize: theme.typography.fontSize.md,
                  color: theme.colors.primary,
                  fontWeight: theme.typography.fontWeight.bold as any,
                }}
              >
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppShell>
  );
}
