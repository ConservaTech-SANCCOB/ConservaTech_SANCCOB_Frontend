import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/colors";

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <LinearGradient colors={["#00567f", "#002e4c"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.banner}>
          <View style={styles.logoCircle}>
            <Image source={require("../../assets/images/sanccob-icon.png")} style={{ width: 50, height: 50, resizeMode: "cover" }} />
          </View>
          <Text style={styles.title}>SANCCOB</Text>
          <Text style={styles.subtitle}>VOLUNTEER PORTAL</Text>
        </LinearGradient>

        <View style={styles.options}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/login")}>
              <Ionicons name="log-in-outline" size={20} color={COLORS.navy} />
              <Text style={styles.primaryButtonText}>Login as Volunteer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.tertiaryButton} onPress={() => router.push("/trainer-pin")}>
              <Ionicons name="school-outline" size={20} color={COLORS.navy} />
              <Text style={styles.tertiaryButtonText}>Login as Trainer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/activate")}>
              <Ionicons name="key-outline" size={20} color={COLORS.navy} />
              <Text style={styles.secondaryButtonText}>Activate New Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>Caring for seabirds, one shift at a time.</Text>
        </View>
      </Animated.View>
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
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  title: { fontSize: 26, fontWeight: "bold", color: COLORS.white, letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: COLORS.sky, letterSpacing: 1, marginTop: 4 },
  options: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 40,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGroup: { flex: 1, justifyContent: "center", gap: 16 },
  footerText: { textAlign: "center", color: COLORS.grey, fontSize: 12, marginTop: 16 },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "rgba(83, 199, 255, 0.75)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  primaryButtonText: { color: COLORS.navy, fontWeight: "bold", fontSize: 16 },
  secondaryButton: {
    flexDirection: "row",
    backgroundColor: "rgba(83, 199, 255, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(83, 199, 255, 0.6)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: { color: COLORS.navy, fontWeight: "bold", fontSize: 16 },
  tertiaryButton: {
    flexDirection: "row",
    backgroundColor: "rgba(83, 199, 255, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(83, 199, 255, 0.6)",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tertiaryButtonText: { color: COLORS.navy, fontWeight: "bold", fontSize: 16 },
});