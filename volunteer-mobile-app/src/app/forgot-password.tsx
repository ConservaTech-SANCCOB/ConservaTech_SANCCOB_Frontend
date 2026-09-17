import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";
import { forgotPassword, resetPassword } from "../services/auth";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert("Email required", "Enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await forgotPassword(email);
      Alert.alert("Check your email", "If an account exists with this email, a reset code has been sent.", [
        { text: "OK", onPress: () => setStep("reset") },
      ]);
    } catch (error) {
      console.error("Forgot password error:", error);
      Alert.alert("Couldn't send reset code", "Something went wrong, try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetCode || !newPassword) {
      Alert.alert("Missing details", "Enter the reset code and a new password.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, resetCode, newPassword);
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Reset password error:", error);
      Alert.alert("Couldn't reset password", "Check the reset code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#00567f", "#002e4c"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.banner}>
        <View style={styles.logoCircle}>
          <Image source={require("../../assets/images/sanccob-icon.png")} style={styles.logoImage} />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {step === "request" ? "ENTER YOUR EMAIL TO GET A RESET CODE" : "ENTER THE CODE AND A NEW PASSWORD"}
        </Text>
      </LinearGradient>

      <View style={styles.background}>
        <View style={styles.form}>
          {step === "request" ? (
            <>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={COLORS.grey} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>
              <TouchableOpacity style={styles.submitButtonWrap} onPress={handleRequestCode} disabled={loading}>
                <LinearGradient
                  colors={["#6FD0FF", "#2BA8E0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="mail-outline" size={20} color={COLORS.white} />
                      <Text style={styles.submitButtonText}>Send Reset Code</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>Reset Code</Text>
              <View style={styles.inputRow}>
                <Ionicons name="keypad-outline" size={18} color={COLORS.grey} />
                <TextInput
                  style={styles.input}
                  value={resetCode}
                  onChangeText={setResetCode}
                  autoCorrect={false}
                />
              </View>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.grey} />
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color={COLORS.grey} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.submitButtonWrap} onPress={handleReset} disabled={loading}>
                <LinearGradient
                  colors={["#6FD0FF", "#2BA8E0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.submitButton}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons name="key-outline" size={20} color={COLORS.white} />
                      <Text style={styles.submitButtonText}>Reset Password</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep("request")}>
                <Text style={styles.helperText}>Didn&apos;t get a code? Send again</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.helperText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: { alignItems: "center", paddingTop: 100, paddingBottom: 60 },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(83, 199, 255, 0.6)",
  },
  logoImage: { width: 60, height: 60, resizeMode: "cover" },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.white },
  subtitle: { fontSize: 12, color: COLORS.sky, letterSpacing: 1, marginTop: 4, textAlign: "center", paddingHorizontal: 24 },
  background: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  form: { padding: 24, paddingTop: 40 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.navy, marginBottom: 6, marginTop: 16 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "rgba(0,46,76,0.3)",
    backgroundColor: COLORS.lightGrey,
    borderRadius: 26,
    paddingHorizontal: 18,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, fontWeight: "600", color: COLORS.navy },
  submitButtonWrap: {
    marginTop: 28,
    borderRadius: 16,
    borderWidth: 0.75,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  submitButton: {
    flexDirection: "row",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
  helperText: { textAlign: "center", color: COLORS.navy, fontSize: 13, marginTop: 20 },
});
