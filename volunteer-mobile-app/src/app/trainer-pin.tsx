import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "../utils/colors";
import { verifyTrainerPin } from "../services/trainers";
import { getErrorStatus } from "../utils/api";
import { showErrorToast } from "../utils/toast";

const PIN_PATTERN = /^\d{6}$/;
// Errors thrown by request() in utils/api.ts always start with this — used to tell
// a still-raw/unparsed error apart from a clean message already extracted from the
// backend's JSON body (see verifyTrainerPin in services/trainers.ts).
const RAW_ERROR_FORMAT = /^API error \d+:/;

export default function TrainerPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!PIN_PATTERN.test(pin)) {
      Alert.alert("Invalid PIN", "Enter the 6-digit trainer PIN.");
      return;
    }
    setLoading(true);
    try {
      await verifyTrainerPin(pin);
      router.push("/trainer-select");
    } catch (error) {
      console.error("Trainer PIN error:", error);
      const status = getErrorStatus(error);
      const isRawFormat = error instanceof Error && RAW_ERROR_FORMAT.test(error.message);
      let message = "Couldn't verify PIN. Try again in a moment.";
      if (status === 401) {
        message = "Incorrect PIN.";
      } else if (error instanceof Error && !isRawFormat && error.message) {
        // A clean message already extracted from the backend's JSON body
        // (e.g. "Trainer access PIN has not been configured.") — safe to show as-is.
        message = error.message;
      }
      showErrorToast("Couldn't sign in", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.title}>Trainer Login</Text>
        <Text style={styles.subtitle}>ENTER THE STAFF PIN</Text>
      </LinearGradient>

      <View style={styles.background}>
        <View style={styles.form}>
          <Text style={styles.label}>Staff PIN</Text>
          <View style={styles.inputRow}>
            <Ionicons name="keypad-outline" size={18} color={COLORS.grey} />
            <TextInput
              style={styles.input}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
          </View>
          <TouchableOpacity style={styles.submitButtonWrap} onPress={handleSubmit} disabled={loading}>
            <View style={styles.submitButton}>
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>Continue</Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.helperText}>Back to options</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: { alignItems: "center", paddingTop: 100, paddingBottom: 120 },
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
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: { fontSize: 12, color: "#7dd3fc", letterSpacing: 1.5, marginTop: 6, fontWeight: "700" },
  background: {
    flex: 1,
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
  form: { padding: 24, paddingTop: 40 },
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
  input: { flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: "600", color: COLORS.navy, letterSpacing: 6 },
  submitButtonWrap: {
    marginTop: 28,
    borderRadius: 40,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButton: {
    flexDirection: "row",
    borderRadius: 40,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00567f",
  },
  submitButtonText: { color: COLORS.white, fontWeight: "600", fontSize: 15.5, letterSpacing: 0.2 },
  helperText: { textAlign: "center", color: COLORS.navy, fontSize: 13, marginTop: 20 },
});
