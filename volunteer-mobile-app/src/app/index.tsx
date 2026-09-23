import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { COLORS } from "../utils/colors";

export default function WelcomeScreen() {
  const router = useRouter();

  const logoFade = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(14)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(14)).current;
  const buttonsFade = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(18)).current;
  const footerFade = useRef(new Animated.Value(0)).current;
  const footerSlide = useRef(new Animated.Value(14)).current;

  const volunteerScale = useRef(new Animated.Value(1)).current;
  const trainerScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const stagger = (fade: Animated.Value, slide: Animated.Value) =>
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]);

    Animated.stagger(90, [
      stagger(logoFade, logoSlide),
      stagger(titleFade, titleSlide),
      stagger(buttonsFade, buttonsSlide),
      stagger(footerFade, footerSlide),
    ]).start();
  }, [logoFade, logoSlide, titleFade, titleSlide, buttonsFade, buttonsSlide, footerFade, footerSlide]);

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  return (
    <View style={styles.container}>
      {/* Clean, deep gradient background */}
      <LinearGradient colors={["#003b5c", "#001a2c"]} style={styles.banner}>
        <LinearGradient
          colors={["rgba(255,255,255,0.08)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Stylized sweeping waves */}
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 380" preserveAspectRatio="none" pointerEvents="none">
          <Path
            d="M-20,40 C60,15 120,55 200,35 C280,15 340,45 420,25 L420,380 L-20,380 Z"
            fill="#ffffff"
            opacity={0.03}
          />
          <Path
            d="M-20,85 C70,110 140,70 220,90 C300,110 350,80 420,95 L420,380 L-20,380 Z"
            fill="#7dd3fc"
            opacity={0.04}
          />
          <Path
            d="M-20,130 C60,105 130,140 210,120 C290,100 350,135 420,115 L420,380 L-20,380 Z"
            fill="#ffffff"
            opacity={0.05}
          />
          <Path
            d="M-20,180 C80,205 150,165 230,185 C310,205 360,175 420,190 L420,380 L-20,380 Z"
            fill="#7dd3fc"
            opacity={0.07}
          />
          <Path
            d="M-20,225 C70,195 140,235 220,215 C300,195 355,230 420,210 L420,380 L-20,380 Z"
            fill="#ffffff"
            opacity={0.09}
          />
          <Path
            d="M-20,270 C80,300 155,260 235,285 C315,310 365,275 420,290 L420,380 L-20,380 Z"
            fill="#7dd3fc"
            opacity={0.11}
          />
          <Path
            d="M-20,320 C80,345 160,310 240,330 C320,350 360,320 420,335 L420,380 L-20,380 Z"
            fill="#ffffff"
            opacity={0.14}
          />
        </Svg>

        <Animated.View style={{ opacity: logoFade, transform: [{ translateY: logoSlide }] }}>
          <View style={styles.logoStage}>
            <View style={styles.logoCircleOuter}>
              <LinearGradient
                colors={["#ffffff", "#e2e8f0", "#cbd5e1", "#ffffff"]}
                locations={[0, 0.4, 0.6, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoCircle}
              >
                <Image source={require("../../assets/images/sanccob-icon.png")} style={{ width: 50, height: 50, resizeMode: "cover" }} />
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ alignItems: "center", opacity: titleFade, transform: [{ translateY: titleSlide }] }}>
          <Text style={styles.title}>SANCCOB</Text>
          <Text style={styles.subtitle}>VOLUNTEER PORTAL</Text>
          <Text style={styles.tagline}>Rescue · Rehabilitate · Release</Text>
        </Animated.View>
      </LinearGradient>

      <View style={styles.options}>
        <Animated.View style={{ flex: 1, width: "100%", alignItems: "center", opacity: buttonsFade, transform: [{ translateY: buttonsSlide }] }}>
          <View style={styles.introGroup}>
            <Text style={styles.eyebrowLabel}>GOOD TO SEE YOU</Text>
            <Text style={styles.welcomeHeading}>Welcome back</Text>
          </View>

          <View style={styles.buttonGroup}>
            <Text style={styles.missionLabel}>Select your account type to proceed</Text>

            <Animated.View style={[styles.volunteerButtonWrap, { transform: [{ scale: volunteerScale }] }]}>
              <TouchableOpacity
                onPress={() => router.push("/login")}
                onPressIn={() => pressIn(volunteerScale)}
                onPressOut={() => pressOut(volunteerScale)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Login as Volunteer"
              >
                <View style={[styles.volunteerButton, { backgroundColor: "#00567f" }]}>
                  <Text style={styles.loginButtonText} numberOfLines={1}>Login as Volunteer</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.volunteerButtonWrap, { transform: [{ scale: trainerScale }] }]}>
              <TouchableOpacity
                onPress={() => router.push("/trainer-pin")}
                onPressIn={() => pressIn(trainerScale)}
                onPressOut={() => pressOut(trainerScale)}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Login as Trainer"
              >
                <View style={[styles.volunteerButton, { backgroundColor: "#00567f" }]}>
                  <Text style={styles.loginButtonText} numberOfLines={1}>Login as Trainer</Text>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Clean Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.activateButtonWrap}
              onPress={() => router.push("/activate")}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Activate New Account"
            >
              <View style={[styles.activateButton, { backgroundColor: "#0284c7" }]}>
                <Text style={styles.loginButtonText} numberOfLines={1}>Activate Account</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={{ alignItems: "center", opacity: footerFade, transform: [{ translateY: footerSlide }] }}>
          <View style={styles.footerBadge}>
            <MaterialCommunityIcons name="hand-heart" size={13} color="#94a3b8" />
            <Text style={styles.footerText}>Caring for seabirds, one shift at a time.</Text>
            <MaterialCommunityIcons name="feather" size={13} color="#94a3b8" />
          </View>
          <Text style={styles.versionText}>v1.0.0</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 166,
  },
  logoStage: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  logoCircleOuter: {
    borderRadius: 50,
    padding: 2,
    backgroundColor: "rgba(77, 184, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
    zIndex: 1,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  subtitle: { fontSize: 13, color: "#7dd3fc", letterSpacing: 1.5, marginTop: 6, fontWeight: "700", zIndex: 1 },
  tagline: { fontSize: 11.5, color: "#8fb4cc", letterSpacing: 0.3, marginTop: 6, fontWeight: "500", zIndex: 1 },
  options: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 100,
    marginTop: -108,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 40,
    shadowColor: "#001a2c",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  buttonGroup: { flex: 1, justifyContent: "flex-end", alignItems: "center", gap: 14, marginTop: 4, width: "100%" },
  introGroup: { width: "100%", alignItems: "flex-start", marginBottom: 24 },
  eyebrowLabel: { fontSize: 12, color: "#0284c7", fontWeight: "800", letterSpacing: 1.4 },
  welcomeHeading: { fontSize: 24, color: COLORS.navy, fontWeight: "600", marginTop: 4 },
  missionLabel: { width: "100%", textAlign: "center", fontSize: 13, color: "#64748b", fontWeight: "600" },
  footerBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },
  footerText: { color: "#94a3b8", fontSize: 12, fontWeight: "500" },
  versionText: { color: "#94a3b8", fontSize: 11, fontWeight: "500", marginTop: 10 },
  volunteerButtonWrap: {
    width: "70%",
    borderRadius: 40,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  volunteerButton: {
    flexDirection: "row",
    borderRadius: 40,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginButtonText: { color: COLORS.white, fontWeight: "600", fontSize: 15.5, letterSpacing: 0.2 },
  dividerRow: { width: "70%", flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1.5, backgroundColor: "#cbd5e1" },
  dividerText: { fontSize: 13, fontWeight: "800", color: "#94a3b8" },
  activateButtonWrap: {
    width: "70%",
    borderRadius: 40,
    shadowColor: "#075985",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  activateButton: {
    flexDirection: "row",
    borderRadius: 40,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
