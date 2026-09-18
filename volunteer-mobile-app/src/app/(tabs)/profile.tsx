import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GLASS_CARD, GLASS_SHADOW_LG } from "../../constants/glassCard";
import { clearToken } from "../../utils/api";
import { COLORS } from "../../utils/colors";
import { getMyProfile, updateMyProfile } from "../../services/profile";

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
      Alert.alert("Couldn't save", "Something went wrong, try again.");
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
    <ImageBackground
      source={require("../../../assets/images/bg_penguin.jpg.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.86)", "rgba(255,255,255,0.76)", "rgba(255,255,255,0.84)"]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8 + insets.top, paddingBottom: 150 }}>
          <View style={styles.nameCard}>
            <Text style={styles.name}>{fullName || "Your Name"}</Text>
            <Text style={styles.roleLabel}>ACTIVE VOLUNTEER</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Details</Text>

            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={COLORS.blue} />
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
                  <LinearGradient
                    colors={["#6FD0FF", "#2BA8E0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.saveButton}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.white} />
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                      </>
                    )}
                  </LinearGradient>
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
            <LinearGradient
              colors={["#FF8A8A", "#EB5757"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.logoutButton}
            >
              <Ionicons name="log-out-outline" size={18} color={COLORS.white} />
              <Text style={styles.logoutText}>Log Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  nameCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    alignItems: "center",
    borderRadius: 22,
    paddingVertical: 20,
    marginBottom: 20,
  },
  name: { fontSize: 18, fontWeight: "800", color: COLORS.navy },
  roleLabel: { fontSize: 11, color: "#3f5f75", fontWeight: "700", letterSpacing: 1, marginTop: 4 },
  card: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.navy, marginBottom: 12 },
  fieldLabel: { fontSize: 10, color: COLORS.grey, fontWeight: "700", marginTop: 10, marginBottom: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,46,76,0.3)",
    backgroundColor: COLORS.lightGrey,
    borderRadius: 26,
    paddingHorizontal: 18,
    gap: 10,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 14, fontWeight: "700", color: COLORS.grey },
  loadingRow: { paddingVertical: 20, alignItems: "center" },
  loadErrorText: { fontSize: 12, color: COLORS.red, marginBottom: 8 },
  saveButtonWrap: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 0.75,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15.25,
    paddingVertical: 14,
  },
  saveButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  contactText: { fontSize: 13, color: COLORS.black },
  logoutButtonWrap: {
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 0.75,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15.25,
    paddingVertical: 14,
  },
  logoutText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
});
