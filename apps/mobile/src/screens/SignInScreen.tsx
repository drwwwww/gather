import { useState } from "react";
import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, Txt, Button, BrandMark,
  palette, font, radius,
} from "../components/ds";
import { supabase } from "../supabase";

function Field({
  label, placeholder, value, onChangeText, secureTextEntry = false,
  keyboardType = "default", autoCapitalize = "none", rightSlot, onRightPress, rightLabel,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  rightSlot?: React.ReactNode;
  onRightPress?: () => void;
  rightLabel?: string;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {rightLabel && onRightPress ? (
          <Pressable onPress={onRightPress} hitSlop={8}>
            <Text style={styles.forgot}>{rightLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ position: "relative" }}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={palette.inkMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.input, rightSlot ? { paddingRight: 60 } : null]}
        />
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>
    </View>
  );
}

export default function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSignIn = async () => {
    if (!supabase) return;
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!supabase || !forgotEmail.trim()) return;
    setForgotLoading(true);
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim());
    setForgotSent(true);
    setForgotLoading(false);
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inner}>
          {/* Brand */}
          <View style={styles.brand}>
            <BrandMark size={72} rounding={22} glow style={{ marginBottom: 18 }} />
            <Text style={styles.wordmark}>Gather</Text>
            <Txt variant="bodyLg" color="inkMuted" center>
              Your church community,{"\n"}all in one place.
            </Txt>
          </View>

          {forgotMode ? (
            <View>
              <Pressable
                onPress={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(""); }}
                style={styles.backRow}
                hitSlop={8}
              >
                <Icon name="chevronLeft" size={18} color={palette.amber} />
                <Text style={styles.backTxt}>Back to sign in</Text>
              </Pressable>

              <Txt variant="h2" style={{ marginBottom: 6 }}>Reset password</Txt>
              <Txt variant="body" color="inkSoft" style={{ marginBottom: 24 }}>
                {forgotSent
                  ? `A reset link was sent to ${forgotEmail}. Check your inbox.`
                  : "Enter your email and we'll send you a reset link."}
              </Txt>

              {!forgotSent ? (
                <>
                  <Field
                    label="EMAIL ADDRESS"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    keyboardType="email-address"
                  />
                  <Button
                    label="Send reset link"
                    onPress={handleForgotPassword}
                    loading={forgotLoading}
                    disabled={!forgotEmail.trim()}
                    style={{ marginTop: 8 }}
                  />
                </>
              ) : (
                <View style={styles.successCard}>
                  <View style={styles.successIcon}>
                    <Icon name="check" size={22} color={palette.amber} />
                  </View>
                  <Txt variant="body" color="inkSoft" style={{ flex: 1 }}>
                    Check your inbox for the reset link.
                  </Txt>
                </View>
              )}
            </View>
          ) : (
            <View>
              <Txt variant="h1" style={{ marginBottom: 6 }}>Welcome back</Txt>
              <Txt variant="body" color="inkSoft" style={{ marginBottom: 24 }}>
                Sign in to your church account.
              </Txt>

              <Field
                label="EMAIL ADDRESS"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <Field
                label="PASSWORD"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightLabel="Forgot?"
                onRightPress={() => setForgotMode(true)}
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

              <Button label="Sign In" onPress={handleSignIn} loading={loading} style={{ marginTop: 8 }} />

              <View style={styles.footer}>
                <Txt variant="body" color="inkSoft">Don't have an account? </Txt>
                <Pressable onPress={() => navigation.replace("SignUp")} hitSlop={8}>
                  <Text style={styles.footerLink}>Sign up</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, paddingHorizontal: 28, justifyContent: "center" },
  brand: { alignItems: "center", marginBottom: 36 },
  wordmark: { fontFamily: font.bold, fontSize: 40, color: palette.ink, letterSpacing: -1, marginBottom: 10 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingHorizontal: 2 },
  fieldLabel: { fontFamily: font.bold, fontSize: 11, color: palette.inkMuted, letterSpacing: 0.8 },
  forgot: { fontFamily: font.semibold, fontSize: 12, color: palette.amber },
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
  backRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 20, alignSelf: "flex-start" },
  backTxt: { fontFamily: font.semibold, fontSize: 14, color: palette.amber },
  errorCard: {
    backgroundColor: palette.dangerSoft,
    borderRadius: radius.sm,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  errorTxt: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, lineHeight: 18 },
  successCard: {
    backgroundColor: palette.amberSofter,
    borderRadius: radius.md,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 8,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28 },
  footerLink: { fontFamily: font.bold, fontSize: 15, color: palette.amber },
});
