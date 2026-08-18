import { useState } from "react";
import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from "react-native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, Txt, Button, BrandMark, OnboardingProgress,
  palette, font, radius,
} from "../components/ds";
import { supabase } from "../supabase";

function Field({
  label, placeholder, value, onChangeText, secureTextEntry = false,
  keyboardType = "default", autoCapitalize = "none", autoComplete, rightSlot,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  autoComplete?: any;
  rightSlot?: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={{ position: "relative" }}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={palette.inkMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          style={[styles.input, rightSlot ? { paddingRight: 60 } : null]}
        />
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
    </View>
  );
}

export default function SignUpScreen({ navigation }: any) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    if (!supabase) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 12, paddingBottom: 40, flexGrow: 1, justifyContent: "center" }}
          showsVerticalScrollIndicator={false}
        >
          {success ? (
            <View style={{ alignItems: "center" }}>
              <View style={styles.successBadge}>
                <Icon name="mail" size={34} color={palette.amber} />
              </View>
              <Txt variant="h2" center style={{ marginBottom: 10 }}>Check your inbox</Txt>
              <Txt variant="body" color="inkSoft" center style={{ marginBottom: 28 }}>
                We sent a confirmation link to{"\n"}
                <Text style={{ fontFamily: font.bold, color: palette.ink }}>{email}</Text>
                {"\n\n"}Open it to activate your account, then sign in.
              </Txt>
              <Button label="Go to sign in" onPress={() => navigation.replace("SignIn")} full={false} style={{ paddingHorizontal: 40 }} />
            </View>
          ) : (
            <View>
              <OnboardingProgress step={1} total={4} label="Create account" />

              {/* Brand */}
              <View style={styles.brand}>
                <BrandMark size={60} rounding={20} glow style={{ marginBottom: 16 }} />
                <Txt variant="h1">Join Gather</Txt>
                <Txt variant="body" color="inkMuted" center style={{ marginTop: 4 }}>
                  Create your church member account.
                </Txt>
              </View>

              <Field
                label="FULL NAME"
                placeholder="Your name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
              />
              <Field
                label="EMAIL ADDRESS"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <Field
                label="PASSWORD"
                placeholder="Choose a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightSlot={
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    <Text style={styles.showHide}>{showPassword ? "Hide" : "Show"}</Text>
                  </Pressable>
                }
              />

              {error ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTxt}>{error}</Text>
                </View>
              ) : null}

              <Button label="Create Account" onPress={handleSignUp} loading={loading} style={{ marginTop: 8 }} />

              <View style={styles.footer}>
                <Txt variant="body" color="inkSoft">Already have an account? </Txt>
                <Pressable onPress={() => navigation.replace("SignIn")} hitSlop={8}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", marginBottom: 28 },
  fieldLabel: { fontFamily: font.bold, fontSize: 11, color: palette.inkMuted, letterSpacing: 0.8, marginBottom: 8, paddingLeft: 2 },
  input: {
    fontFamily: font.regular,
    fontSize: 15,
    color: palette.ink,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.line,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rightSlot: { position: "absolute", right: 0, top: 0, bottom: 0, justifyContent: "center", paddingRight: 16 },
  showHide: { fontFamily: font.semibold, fontSize: 12, color: palette.inkSoft },
  successBadge: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: palette.amberSofter,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  errorCard: {
    backgroundColor: palette.dangerSoft,
    borderRadius: radius.sm,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  errorTxt: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, lineHeight: 18 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerLink: { fontFamily: font.bold, fontSize: 15, color: palette.amber },
});
