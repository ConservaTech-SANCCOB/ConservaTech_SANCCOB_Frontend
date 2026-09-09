import { useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.logoCircle}>
          <Image source={require("../../assets/images/sanccob-icon.png")} style={{ width: 50, height: 50, resizeMode: "cover" }} />
        </View>
        <Text style={styles.title}>SANCCOB</Text>
        <Text style={styles.subtitle}>VOLUNTEER PORTAL</Text>
      </View>

      <View style={styles.options}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/login")}>
          <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
          <Text style={styles.primaryButtonText}>Login as Volunteer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/activate")}>
          <Ionicons name="key-outline" size={20} color={COLORS.blue} />
          <Text style={styles.secondaryButtonText}>Activate New Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tertiaryButton}
          onPress={() => Alert.alert("Coming Soon", "Staff login isn't available in this app yet.")}
        >
          <Text style={styles.tertiaryButtonText}>Login as Staff</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: { backgroundColor: COLORS.navy, alignItems: "center", paddingTop: 100, paddingBottom: 60 },
  logoCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.white, alignItems: "center", justifyContent: "center", marginBottom: 16, overflow: "hidden" },
  title: { fontSize: 26, fontWeight: "bold", color: COLORS.white },
  subtitle: { fontSize: 13, color: COLORS.sky, letterSpacing: 1, marginTop: 4 },
  options: { flex: 1, padding: 24, justifyContent: "center", gap: 14 },
  primaryButton: { flexDirection: "row", backgroundColor: COLORS.sky, borderRadius: 8, paddingVertical: 14, alignItems: "center", justifyContent: "center", gap: 8 },
  primaryButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
  secondaryButton: { flexDirection: "row", borderWidth: 1, borderColor: COLORS.blue, borderRadius: 8, paddingVertical: 14, alignItems: "center", justifyContent: "center", gap: 8 },
  secondaryButtonText: { color: COLORS.blue, fontWeight: "bold", fontSize: 16 },
  tertiaryButton: { alignItems: "center", paddingVertical: 12 },
  tertiaryButtonText: { color: COLORS.grey, fontSize: 14 },
});