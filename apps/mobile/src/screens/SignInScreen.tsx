import { useState } from "react";
import { View, Text, TextInput, Image } from "react-native";
import { Button } from '../components/ui/Button';
import { AppShell } from '../components/app/AppShell';
import { theme } from '../theme/theme';
import { supabase } from "../supabase";

export default function SignInScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!supabase) {
      navigation.replace("Home");
      return;
    }
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigation.replace("Home");
  };

  return (
    <AppShell>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: theme.spacing.lg }}>
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <Image source={require('../../assets/logo.png')} style={{ width: 48, height: 48, marginBottom: theme.spacing.sm }} />
          <Text style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.title,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.primaryText,
            marginBottom: theme.spacing.xs,
          }}>Sign In</Text>
          <Text style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.muted,
          }}>Access your member and service team tools.</Text>
        </View>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.radii.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.primaryText,
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            borderWidth: 1,
            borderRadius: theme.radii.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.md,
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.primaryText,
          }}
        />
        {error ? <Text style={{ color: theme.colors.error, marginBottom: theme.spacing.md }}>{error}</Text> : null}
        <Button onPress={handleSignIn}>Sign In</Button>
        <Button onPress={() => navigation.replace('SignUp')} variant="secondary" style={{ marginTop: theme.spacing.md }}>Sign up now</Button>
      </View>
    </AppShell>
  );
}
