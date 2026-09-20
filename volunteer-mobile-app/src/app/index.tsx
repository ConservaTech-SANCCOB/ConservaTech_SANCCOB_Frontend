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
          <View style={styles.introGroup}>
            <Text style={styles.welcomeLabel}>WELCOME!</Text>
            <Text style={styles.sectionLabel}>Select your account type to proceed:</Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.optionRowWrap} onPress={() => router.push("/login")}>
              <LinearGradient
                colors={["#00567f", "#002e4c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.optionRow}
              >
                <Image
                  source={require("../../assets/images/volunteer-icon.png")}
                  style={[styles.iconImage, { width: 39 }]}
                  resizeMode="contain"
                />
                <View style={styles.optionTextCol}>
                  <Text style={styles.optionTitle}>Login as Volunteer</Text>
                  <Text style={styles.optionSubtitle}>Access your tracking dashboard</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRowWrap} onPress={() => router.push("/trainer-pin")}>
              <LinearGradient
                colors={["#00567f", "#002e4c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.optionRow}
              >
                <Image
                  source={require("../../assets/images/trainer-icon.png")}
                  style={[styles.iconImage, { width: 34 }]}
                  resizeMode="contain"
                />
                <View style={styles.optionTextCol}>
                  <Text style={styles.optionTitle}>Login as Trainer</Text>
                  <Text style={styles.optionSubtitle}>Manage operations and teams</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={COLORS.white} />
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.activateButtonWrap} onPress={() => router.push("/activate")}>
              <LinearGradient
                colors={["#6FD0FF", "#2BA8E0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.activateButton}
              >
                <View style={styles.activateIconSpacer} />
                <View style={styles.optionTextCol}>
                  <Text style={styles.activateButtonText}>Activate New Account</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={COLORS.white} />
              </LinearGradient>
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
  buttonGroup: { flex: 1, justifyContent: "center", alignItems: "center", gap: 16 },
  introGroup: { alignItems: "center" },
  welcomeLabel: {
    fontSize: 13,
    color: COLORS.navy,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
  },
  sectionLabel: {
    fontSize: 13,
    color: COLORS.navy,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 4,
  },
  footerText: { textAlign: "center", color: COLORS.grey, fontSize: 12, marginTop: 16 },
  optionRowWrap: {
    width: "94%",
    borderRadius: 20,
    borderWidth: 0.75,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderRadius: 19.25,
    padding: 22,
  },
  iconImage: { height: 40, tintColor: COLORS.blue },
  optionTextCol: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.white },
  optionSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 3,
  },
  dividerRow: { width: "94%", flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(0,46,76,0.15)" },
  dividerText: { fontSize: 12, fontWeight: "700", color: COLORS.grey },
  activateButtonWrap: {
    width: "94%",
    borderRadius: 20,
    borderWidth: 0.75,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  activateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    borderRadius: 19.25,
    padding: 22,
  },
  activateIconSpacer: { width: 37 },
  activateButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },
});