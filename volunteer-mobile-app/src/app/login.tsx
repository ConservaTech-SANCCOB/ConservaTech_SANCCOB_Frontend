import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";
import { login } from "../services/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing details", "Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login failed", "Check your email and password and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.logoCircle}>
          <Image source={require("../../assets/images/sanccob-icon.png")} style={styles.logoImage} />
        </View>
        <Text style={styles.title}>SANCCOB</Text>
        <Text style={styles.subtitle}>VOLUNTEER PORTAL</Text>
      </View>

      <ImageBackground
        source={require("../../assets/images/bg_penguin.jpg.jpeg")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={22} color={COLORS.grey} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert("Coming Soon", "Password reset isn't available yet.")}>
  <Text style={styles.helperText}>Forgot your password?</Text>
</TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.helperText}>Back to options</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: { backgroundColor: COLORS.navy, alignItems: "center", paddingTop: 80, paddingBottom: 32 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden" },
  logoImage: { width: 60, height: 60, resizeMode: "cover" },
  title: { fontSize: 26, fontWeight: "bold", color: COLORS.white },
  subtitle: { fontSize: 13, color: COLORS.sky, letterSpacing: 1, marginTop: 4 },
  background: { flex: 1 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.55)" },
  form: { padding: 24, flex: 1, justifyContent: "center" },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.navy, marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: "#D8DCDF", backgroundColor: COLORS.white, borderRadius: 8, padding: 12 },
  passwordRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D8DCDF", backgroundColor: COLORS.white, borderRadius: 8, paddingHorizontal: 12 },
  passwordInput: { flex: 1, paddingVertical: 12 },
  loginButton: { backgroundColor: COLORS.blue, borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 28 },
  loginButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
  helperText: { textAlign: "center", color: COLORS.navy, fontSize: 12, marginTop: 16, lineHeight: 18 },
});