import { useState } from "react";
import {
  View, Text, TextInput, Pressable,
  KeyboardAvoidingView, Platform, StyleSheet, Animated,
} from "react-native";
import { Icon } from "../components/ui/Icon";
import {
  Screen, GlassIconButton, LinearGradient,
  palette, font, gradient, radius, shadow, space,
} from "../components/ds";
import { RiseIn, usePressScale } from "../components/ds/motion";
import { supabase } from "../supabase";
import { toE164 } from "../lib/phone";

type Step = "identifier" | "password" | "forgot";
type IdentifierMode = "email" | "phone";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Large filled field — no label row, matches the reference's single big
    tappable input rather than our usual labelled-field pattern. */
function BigField({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoFocus,
  rightSlot,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoFocus?: boolean;
  rightSlot?: React.ReactNode;
}) {
  return (
    <View style={{ position: "relative" }}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.inkMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType ?? (secureTextEntry ? "default" : "email-address")}
        autoFocus={autoFocus}
        style={[styles.bigInput, rightSlot ? { paddingRight: 64 } : null]}
      />
      {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
    </View>
  );
}

/** Small pill toggle between email and phone as the sign-in identifier. */
function ModeToggle({ mode, onChange }: { mode: IdentifierMode; onChange: (m: IdentifierMode) => void }) {
  return (
    <View style={styles.modeToggle}>
      <Pressable style={[styles.modeBtn, mode === "email" && styles.modeBtnActive]} onPress={() => onChange("email")}>
        <Text style={[styles.modeBtnTxt, mode === "email" && styles.modeBtnTxtActive]}>Email</Text>
      </Pressable>
      <Pressable style={[styles.modeBtn, mode === "phone" && styles.modeBtnActive]} onPress={() => onChange("phone")}>
        <Text style={[styles.modeBtnTxt, mode === "phone" && styles.modeBtnTxtActive]}>Phone</Text>
      </Pressable>
    </View>
  );
}

/** Full-width pill CTA — amber gradient when enabled, flat and muted when
    not. The fully-rounded shape is deliberately different from the app's
    usual radius.lg buttons, kept local to this screen to match the
    reference rather than changing the shared Button everywhere. */
function PillButton({
  label,
  onPress,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const press = usePressScale(0.98);
  const isDisabled = disabled || loading;
  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={onPress}
        onPressIn={isDisabled ? undefined : press.onPressIn}
        onPressOut={isDisabled ? undefined : press.onPressOut}
        disabled={isDisabled}
      >
        {isDisabled ? (
          <View style={[styles.pillBtn, styles.pillBtnFlat]}>
            <Text style={styles.pillBtnTxtFlat}>{loading ? "Please wait…" : label}</Text>
          </View>
        ) : (
          <LinearGradient
            colors={gradient.sunset}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.pillBtn, shadow.amber]}
          >
            <Text style={styles.pillBtnTxt}>{label}</Text>
          </LinearGradient>
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function SignInScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>("identifier");
  const [mode, setMode] = useState<IdentifierMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const phoneValid = toE164(phone) !== null;
  const identifierValid = mode === "email" ? emailValid : phoneValid;
  const identifierDisplay = mode === "email" ? email.trim() : phone.trim();

  const goToPassword = () => {
    if (!identifierValid) return;
    setError(null);
    setStep("password");
  };

  const handleSignIn = async () => {
    if (!supabase || !password) return;
    setError(null);
    setLoading(true);
    const credential = mode === "email"
      ? { email: email.trim() }
      : { phone: toE164(phone) ?? "" };
    const { error: signInError } = await supabase.auth.signInWithPassword({
      ...credential,
      password,
    } as any);
    if (signInError) setError(signInError.message);
    setLoading(false);
  };

  const openForgot = () => {
    setForgotEmail(email.trim());
    setForgotSent(false);
    setStep("forgot");
  };

  const handleForgotPassword = async () => {
    if (!supabase || !forgotEmail.trim()) return;
    setForgotLoading(true);
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim());
    setForgotSent(true);
    setForgotLoading(false);
  };

  const back = () => {
    setError(null);
    if (step === "forgot") setStep("password");
    else if (step === "password") setStep("identifier");
  };

  return (
    <Screen edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.topRow}>
          {step !== "identifier" ? (
            <GlassIconButton icon="chevronLeft" onPress={back} accessibilityLabel="Back" />
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        <View style={styles.inner}>
          {step === "identifier" && (
            <RiseIn key="identifier">
              <Text style={styles.headline}>
                {mode === "email"
                  ? "Enter your email to sign in or create an account"
                  : "Enter your phone to sign in or create an account"}
              </Text>

              <View style={{ marginTop: 20 }}>
                <ModeToggle mode={mode} onChange={setMode} />
              </View>

              <View style={styles.fieldBlock}>
                {mode === "email" ? (
                  <BigField
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email address"
                    keyboardType="email-address"
                    autoFocus
                  />
                ) : (
                  <BigField
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="(555) 123-4567"
                    keyboardType="phone-pad"
                    autoFocus
                  />
                )}
                <Text style={styles.caption}>We'll check if you already have an account.</Text>
              </View>

              <View style={styles.ctaBlock}>
                <PillButton label="Continue" onPress={goToPassword} disabled={!identifierValid} />
              </View>
            </RiseIn>
          )}

          {step === "password" && (
            <RiseIn key="password">
              <Text style={styles.headline}>Enter your password</Text>
              <Text style={styles.subHeadline} numberOfLines={1}>
                {identifierDisplay}
              </Text>

              <View style={styles.fieldBlock}>
                <BigField
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  autoFocus
                  rightSlot={
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                      <Text style={styles.showHide}>{showPassword ? "Hide" : "Show"}</Text>
                    </Pressable>
                  }
                />
                {mode === "email" ? (
                  <Pressable onPress={openForgot} hitSlop={8} style={styles.forgotRow}>
                    <Text style={styles.forgotTxt}>Forgot your password?</Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.caption, { textAlign: "right", marginTop: 14 }]}>
                    Forgot your password? Ask your church admin to reset it.
                  </Text>
                )}
              </View>

              {error ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTxt}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.ctaBlock}>
                <PillButton label="Sign In" onPress={handleSignIn} disabled={!password} loading={loading} />
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerTxt}>Don't have an account? </Text>
                <Pressable onPress={() => navigation.replace("SignUp")} hitSlop={8}>
                  <Text style={styles.footerLink}>Sign up</Text>
                </Pressable>
              </View>
            </RiseIn>
          )}

          {step === "forgot" && (
            <RiseIn key="forgot">
              <Text style={styles.headline}>Reset your password</Text>
              <Text style={styles.subHeadline} numberOfLines={2}>
                {forgotSent
                  ? `A reset link was sent to ${forgotEmail}.`
                  : "We'll email you a link to set a new one."}
              </Text>

              {!forgotSent ? (
                <>
                  <View style={styles.fieldBlock}>
                    <BigField
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      placeholder="Email address"
                    />
                  </View>
                  <View style={styles.ctaBlock}>
                    <PillButton
                      label="Send reset link"
                      onPress={handleForgotPassword}
                      disabled={!forgotEmail.trim()}
                      loading={forgotLoading}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.successCard}>
                  <View style={styles.successIcon}>
                    <Icon name="check" size={20} color={palette.amberDeep} />
                  </View>
                  <Text style={styles.successTxt}>Check your inbox for the link.</Text>
                </View>
              )}
            </RiseIn>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { paddingHorizontal: space.gutter, paddingTop: 8, height: 56, justifyContent: "center" },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 24 },

  headline: {
    fontFamily: font.semibold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    color: palette.ink,
  },
  subHeadline: {
    fontFamily: font.regular,
    fontSize: 15,
    color: palette.inkSoft,
    marginTop: 8,
  },

  modeToggle: {
    flexDirection: "row",
    backgroundColor: palette.sunken,
    borderRadius: radius.md,
    padding: 3,
  },
  modeBtn: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: radius.sm },
  modeBtnActive: { backgroundColor: palette.surface, ...shadow.sm },
  modeBtnTxt: { fontFamily: font.semibold, fontSize: 13, color: palette.inkMuted },
  modeBtnTxtActive: { color: palette.ink },

  fieldBlock: { marginTop: 32 },
  bigInput: {
    fontFamily: font.regular,
    fontSize: 17,
    color: palette.ink,
    backgroundColor: palette.sunken,
    borderRadius: radius.lg,
    paddingHorizontal: 20,
    paddingVertical: 19,
  },
  rightSlot: { position: "absolute", right: 0, top: 0, bottom: 0, justifyContent: "center", paddingRight: 20 },
  showHide: { fontFamily: font.semibold, fontSize: 13, color: palette.inkSoft },

  caption: {
    fontFamily: font.regular,
    fontSize: 13,
    color: palette.inkMuted,
    textAlign: "center",
    marginTop: 16,
  },
  forgotRow: { alignSelf: "flex-end", marginTop: 14 },
  forgotTxt: { fontFamily: font.semibold, fontSize: 13, color: palette.amberDeep },

  ctaBlock: { marginTop: 28 },
  pillBtn: {
    minHeight: 58,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pillBtnTxt: { fontFamily: font.bold, fontSize: 16, color: palette.onDark, letterSpacing: 0.2 },
  pillBtnFlat: { backgroundColor: palette.sunken },
  pillBtnTxtFlat: { fontFamily: font.bold, fontSize: 16, color: palette.inkMuted, letterSpacing: 0.2 },

  errorCard: {
    backgroundColor: palette.dangerSoft,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 20,
  },
  errorTxt: { fontFamily: font.regular, fontSize: 13, color: palette.dangerInk, lineHeight: 18 },

  successCard: {
    backgroundColor: palette.amberSofter,
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 32,
  },
  successIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  successTxt: { fontFamily: font.regular, fontSize: 14, color: palette.ink, flex: 1, lineHeight: 20 },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28 },
  footerTxt: { fontFamily: font.regular, fontSize: 14, color: palette.inkSoft },
  footerLink: { fontFamily: font.bold, fontSize: 14, color: palette.amberDeep },
});
