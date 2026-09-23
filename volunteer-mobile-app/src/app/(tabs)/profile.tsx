import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { clearToken } from "../../utils/api";
import { COLORS } from "../../utils/colors";
import { getMyProfile, updateMyProfile } from "../../services/profile";
import { showErrorToast } from "../../utils/toast";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [ageBracket, setAgeBracket] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        setFirstName(profile.firstName ?? "");
        setLastName(profile.lastName ?? "");
        setEmail(profile.email ?? "");
        setPhone(profile.phoneNumber ?? "");
        setNationality(profile.nationality ?? "");
        setAgeBracket(profile.ageBracket ?? "");
      })
      .catch((error) => {
        console.error("Load profile error:", error);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }
    setSaving(true);
    try {
      await updateMyProfile({
        email: email.trim(),
        phoneNumber: phone.trim() || null,
        nationality: nationality.trim() || null,
        ageBracket: ageBracket.trim() || null,
      });
      Alert.alert("Saved", "Your profile has been updated.");
    } catch (error) {
      console.error("Save profile error:", error);
      showErrorToast("Couldn't save", "Something went wrong. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearToken();
          router.replace("/");
        },
      },
    ]);
  };

  const fullName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[COLORS.pinkLight, COLORS.pinkDark]}
          style={[styles.banner, { paddingTop: 16 + insets.top }]}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.08)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 260" preserveAspectRatio="none" pointerEvents="none">
            <Path d="M-20,26 C40,16 90,32 140,24 C190,16 240,30 290,22 C330,16 380,26 420,18 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.03} />
            <Path d="M-20,46 C40,38 90,52 140,44 C190,36 240,50 290,42 C330,36 380,46 420,40 L420,260 L-20,260 Z" fill={COLORS.pinkAccentLight} opacity={0.04} />
            <Path d="M-20,68 C40,58 90,74 140,64 C190,54 240,70 290,60 C330,54 380,66 420,58 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.05} />
            <Path d="M-20,90 C40,82 90,96 140,86 C190,76 240,92 290,82 C330,76 380,88 420,80 L420,260 L-20,260 Z" fill={COLORS.pinkAccentLight} opacity={0.07} />
            <Path d="M-20,112 C40,102 90,118 140,108 C190,98 240,114 290,104 C330,98 380,110 420,102 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.08} />
            <Path d="M-20,134 C40,126 90,140 140,130 C190,120 240,136 290,126 C330,120 380,132 420,124 L420,260 L-20,260 Z" fill={COLORS.pinkAccentLight} opacity={0.09} />
            <Path d="M-20,156 C40,146 90,162 140,152 C190,142 240,158 290,148 C330,142 380,154 420,146 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.11} />
            <Path d="M-20,178 C40,170 90,184 140,174 C190,164 240,180 290,170 C330,164 380,176 420,168 L420,260 L-20,260 Z" fill={COLORS.pinkAccentLight} opacity={0.12} />
            <Path d="M-20,200 C40,190 90,206 140,196 C190,186 240,202 290,192 C330,186 380,198 420,190 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.14} />
            <Path d="M-20,222 C40,214 90,228 140,218 C190,208 240,224 290,214 C330,208 380,220 420,212 L420,260 L-20,260 Z" fill={COLORS.pinkAccentLight} opacity={0.16} />
          </Svg>

          <View style={styles.bannerTopRow}>
            <View style={styles.nameBadge}>
              <Text style={styles.nameBadgeText}>{fullName || "Your Name"}</Text>
            </View>
          </View>

          <View style={styles.titleGroup}>
            <Text style={styles.subtitle}>ACTIVE VOLUNTEER</Text>
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Details</Text>

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={COLORS.pinkMid} />
              </View>
            ) : (
              <>
                {loadError && (
                  <Text style={styles.loadErrorText}>Couldn&apos;t load your profile. Try again in a moment.</Text>
                )}

                <Text style={styles.fieldLabel}>FIRST NAME</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.grey} />
                  <TextInput style={styles.input} value={firstName} editable={false} />
                </View>

                <Text style={styles.fieldLabel}>LAST NAME</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.grey} />
                  <TextInput style={styles.input} value={lastName} editable={false} />
                </View>

                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.grey} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>

                <Text style={styles.fieldLabel}>MOBILE PHONE</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="call-outline" size={18} color={COLORS.grey} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <Text style={styles.fieldLabel}>NATIONALITY</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="flag-outline" size={18} color={COLORS.grey} />
                  <TextInput
                    style={styles.input}
                    value={nationality}
                    onChangeText={setNationality}
                  />
                </View>

                <Text style={styles.fieldLabel}>AGE BRACKET</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="hourglass-outline" size={18} color={COLORS.grey} />
                  <TextInput
                    style={styles.input}
                    value={ageBracket}
                    onChangeText={setAgeBracket}
                  />
                </View>

                <TouchableOpacity style={styles.saveButtonWrap} onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact Support</Text>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={18} color={COLORS.grey} />
              <Text style={styles.contactText}>volunteers@sanccob.co.za</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={18} color={COLORS.grey} />
              <Text style={styles.contactText}>+27 21 557 6155</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButtonWrap} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: {
    paddingBottom: 90,
  },
  bannerTopRow: {
    paddingHorizontal: 20,
    marginBottom: 18,
    zIndex: 1,
  },
  nameBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  nameBadgeText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  titleGroup: {
    // Lines the eyebrow up with the name inside the badge: banner gutter + badge padding + its border.
    paddingLeft: 41,
    paddingRight: 20,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.pinkAccentLight,
    letterSpacing: 1.5,
    marginTop: 6,
    fontWeight: "700",
    zIndex: 1,
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 28,
    shadowColor: COLORS.pinkDark,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#b3c3cc",
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15.5, fontWeight: "700", color: COLORS.pinkLight, marginBottom: 12 },
  fieldLabel: { fontSize: 10, color: COLORS.grey, fontWeight: "700", letterSpacing: 0.5, marginTop: 12, marginBottom: 5 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbe3e7",
    backgroundColor: COLORS.lightGrey,
    borderRadius: 26,
    paddingHorizontal: 18,
    gap: 10,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, fontWeight: "700", color: COLORS.grey },
  loadingRow: { paddingVertical: 20, alignItems: "center" },
  loadErrorText: { fontSize: 12, color: COLORS.red, marginBottom: 8 },
  saveButtonWrap: {
    marginTop: 22,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 30,
    backgroundColor: COLORS.pinkMid,
    shadowColor: COLORS.pinkDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  contactText: { fontSize: 13, color: "#1b2a33" },
  logoutButtonWrap: {
    marginTop: 4,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 30,
    backgroundColor: "#7a1228",
    shadowColor: "#2e0810",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  logoutText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
});
