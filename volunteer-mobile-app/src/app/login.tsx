import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import KeyboardAvoidingScreen from "../components/KeyboardAvoidingScreen";
import { COLORS } from "../utils/colors";
import { login } from "../services/auth";
import { getErrorMessage, getErrorStatus } from "../utils/api";
import { showErrorToast } from "../utils/toast";
import { logError } from "../utils/logError";

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
      logError("Login error", error);
      const status = getErrorStatus(error);
      showErrorToast("Login failed", status === 401 ? "Incorrect email or password" : getErrorMessage(error, "Couldn't log in. Try again in a moment."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingScreen style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
        <LinearGradient colors={["#003b5c", "#001a2c"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.banner}>
          <LinearGradient
            colors={["rgba(255,255,255,0.08)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Stylized sweeping waves */}
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 380" preserveAspectRatio="none" pointerEvents="none">
            <Path d="M-20,40 C60,15 120,55 200,35 C280,15 340,45 420,25 L420,380 L-20,380 Z" fill="#ffffff" opacity={0.03} />
            <Path d="M-20,85 C70,110 140,70 220,90 C300,110 350,80 420,95 L420,380 L-20,380 Z" fill="#7dd3fc" opacity={0.04} />
            <Path d="M-20,130 C60,105 130,140 210,120 C290,100 350,135 420,115 L420,380 L-20,380 Z" fill="#ffffff" opacity={0.05} />
            <Path d="M-20,180 C80,205 150,165 230,185 C310,205 360,175 420,190 L420,380 L-20,380 Z" fill="#7dd3fc" opacity={0.07} />
            <Path d="M-20,225 C70,195 140,235 220,215 C300,195 355,230 420,210 L420,380 L-20,380 Z" fill="#ffffff" opacity={0.09} />
            <Path d="M-20,270 C80,300 155,260 235,285 C315,310 365,275 420,290 L420,380 L-20,380 Z" fill="#7dd3fc" opacity={0.11} />
            <Path d="M-20,320 C80,345 160,310 240,330 C320,350 360,320 420,335 L420,380 L-20,380 Z" fill="#ffffff" opacity={0.14} />
          </Svg>

          <View style={styles.logoCircleOuter}>
            <LinearGradient
              colors={["#ffffff", "#e2e8f0", "#cbd5e1", "#ffffff"]}
              locations={[0, 0.4, 0.6, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Image source={require("../../assets/images/sanccob-icon.png")} style={styles.logoImage} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>SANCCOB</Text>
          <Text style={styles.subtitle}>VOLUNTEER PORTAL</Text>
        </LinearGradient>

        <View style={styles.background}>
          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color={COLORS.grey} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                accessibilityLabel="Email address"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.grey} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                accessibilityLabel="Password"
                secureTextEntry={!showPassword}
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.grey} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.loginButtonWrap} onPress={handleLogin} disabled={loading}>
              <View style={styles.loginButton}>
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/forgot-password")}>
              <Text style={styles.helperText}>Forgot your password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.helperText}>Back to options</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: { alignItems: "center", paddingTop: 90, paddingBottom: 170 },
  logoCircleOuter: {
    borderRadius: 48,
    padding: 2,
    backgroundColor: "rgba(77, 184, 255, 0.3)",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: { width: 48, height: 48, resizeMode: "cover" },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: { fontSize: 13, color: "#7dd3fc", letterSpacing: 1.5, marginTop: 6, fontWeight: "700" },
  background: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -32,
    shadowColor: "#001a2c",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  form: { paddingHorizontal: 24 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.navy, marginBottom: 6, marginTop: 16 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(0,46,76,0.15)",
    backgroundColor: COLORS.lightGrey,
    borderRadius: 26,
    paddingHorizontal: 18,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, fontWeight: "600", color: COLORS.navy },
  loginButtonWrap: {
    marginTop: 28,
    borderRadius: 40,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  loginButton: {
    flexDirection: "row",
    borderRadius: 40,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00567f",
  },
  loginButtonText: { color: COLORS.white, fontWeight: "600", fontSize: 15.5, letterSpacing: 0.2 },
  helperText: { textAlign: "center", color: COLORS.navy, fontSize: 12, marginTop: 16, lineHeight: 18 },
});