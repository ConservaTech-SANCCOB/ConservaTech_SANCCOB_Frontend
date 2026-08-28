import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    router.replace("/(tabs)/home");
  };

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.logoCircle}>
          <Ionicons name="paw-outline" size={40} color={COLORS.navy} />
        </View>
        <Text style={styles.title}>SANCCOB</Text>
        <Text style={styles.subtitle}>VOLUNTEER PORTAL</Text>
      </View>

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

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>

        <Text style={styles.helperText}>
          Accounts are created by SANCCOB admin after your application is approved.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: { backgroundColor: COLORS.navy, alignItems: "center", paddingTop: 80, paddingBottom: 40 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "bold", color: COLORS.white },
  subtitle: { fontSize: 13, color: COLORS.sky, letterSpacing: 1, marginTop: 4 },
  form: { padding: 24 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.navy, marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: "#D8DCDF", backgroundColor: "#F5F7F8", borderRadius: 8, padding: 12 },
  passwordRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D8DCDF", backgroundColor: "#F5F7F8", borderRadius: 8, paddingHorizontal: 12 },
  passwordInput: { flex: 1, paddingVertical: 12 },
  loginButton: { backgroundColor: COLORS.sky, borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 28 },
  loginButtonText: { color: COLORS.navy, fontWeight: "bold", fontSize: 16 },
  helperText: { textAlign: "center", color: COLORS.grey, fontSize: 12, marginTop: 16, lineHeight: 18 },
});