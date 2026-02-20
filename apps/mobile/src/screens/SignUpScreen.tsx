import { useState } from "react";
import { View, Text, TextInput, Pressable, Image } from "react-native";
import { ui } from "../ui";
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
      options: { data: { full_name: fullName } }
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    // After sign up, go to church selection
    const user = data.user;
    if (user) {
      navigation.replace("ChurchSelect", { userId: user.id, fullName, email });
      setLoading(false);
      return;
    }
    setError("Check your email to confirm your account, then sign in.");
    setLoading(false);
  };

  return (
    <View style={[ui.screen, { justifyContent: "center" }]}> 
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <Image source={require("../../assets/logo.png")} style={{ width: 48, height: 48, marginBottom: 8 }} />
        <Text style={[ui.title, { marginBottom: 4 }]}>Create your account</Text>
        <Text style={ui.subtitle}>Create your member account to join your church.</Text>
      </View>
      <TextInput
        placeholder="Full name"
        placeholderTextColor="#7B735D"
        value={fullName}
        onChangeText={setFullName}
        style={ui.input}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#7B735D"
        value={email}
        onChangeText={setEmail}
        style={ui.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#7B735D"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={ui.input}
      />
      {error ? <Text style={{ color: "#C46B5D", marginBottom: 12, textAlign: 'center' }}>{
        error.includes('Supabase') && error.includes('key')
          ? 'Something went wrong. Please try again later.'
          : error
      }</Text> : null}
      <Pressable onPress={handleSignUp} style={[ui.button, loading && { opacity: 0.7 }]}
        disabled={loading}
      >
        <Text style={ui.buttonText}>{loading ? "Creating..." : "Sign up"}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.replace("SignIn")}
        style={[ui.buttonGhost, { marginTop: 16 }]}
      >
        <Text style={ui.buttonText}>Already have an account? Sign in</Text>
      </Pressable>
    </View>
  );
}
