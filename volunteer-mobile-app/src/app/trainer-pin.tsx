import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";

export default function TrainerPinScreen() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (pin.length < 4) {
      Alert.alert("Invalid PIN", "Enter the shared trainer PIN.");
      return;
    }
    setLoading(true);
    try {
      // TODO: replace with a real check once a trainer PIN endpoint exists
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/trainer-select");
    } catch (error) {
      console.error("Trainer PIN error:", error);
      Alert.alert("Incorrect PIN", "Check the PIN and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.logoCircle}>
          <MaterialCommunityIcons name="penguin" size={40} color={COLORS.navy} />
        </View>
        <Text style={styles.title}>Trainer Login</Text>
        <Text style={styles.subtitle}>ENTER THE STAFF PIN</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Staff PIN</Text>
        <TextInput
          style={styles.input}
          placeholder="••••"
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.submitButtonText}>Continue</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.helperText}>Back to options</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: { backgroundColor: COLORS.navy, alignItems: "center", paddingTop: 100, paddingBottom: 40 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden" },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.white },
  subtitle: { fontSize: 12, color: COLORS.sky, letterSpacing: 1, marginTop: 4 },
  form: { padding: 24 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.navy, marginBottom: 6, marginTop: 16 },
  input: { borderWidth: 1, borderColor: "#D8DCDF", backgroundColor: "#F5F7F8", borderRadius: 8, padding: 12, fontSize: 20, textAlign: "center", letterSpacing: 8 },
  submitButton: { backgroundColor: COLORS.blue, borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 28 },
  submitButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
  helperText: { textAlign: "center", color: COLORS.navy, fontSize: 13, marginTop: 20 },
});