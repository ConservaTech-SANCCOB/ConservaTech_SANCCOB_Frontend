import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";
import { verifyTrainerPin } from "../services/trainers";
import { getErrorStatus } from "../utils/api";
import { showErrorToast } from "../utils/toast";

const PIN_PATTERN = /^\d{7}$/;
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
      Alert.alert("Invalid PIN", "Enter the 7-digit trainer PIN.");
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
      <LinearGradient colors={["#00567f", "#002e4c"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.banner}>
        <View style={styles.logoCircle}>
          <Image source={require("../../assets/images/sanccob-icon.png")} style={styles.logoImage} />
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
              maxLength={7}
            />
          </View>
          <TouchableOpacity style={styles.submitButtonWrap} onPress={handleSubmit} disabled={loading}>
            <LinearGradient
              colors={["#00567f", "#002e4c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Continue</Text>
                </>
              )}
            </LinearGradient>
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
  subtitle: { fontSize: 12, color: COLORS.sky, letterSpacing: 1, marginTop: 4 },
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
  input: { flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: "600", color: COLORS.navy, letterSpacing: 6 },
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
