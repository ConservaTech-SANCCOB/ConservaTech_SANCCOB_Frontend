import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GLASS_CARD, GLASS_SHADOW_LG } from "../../constants/glassCard";
import { clearToken } from "../../utils/api";
import { COLORS } from "../../utils/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const [firstName] = useState("");
  const [lastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [ageBracket, setAgeBracket] = useState("");

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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 150 }}>
          <View style={styles.nameCard}>
            <Text style={styles.name}>{fullName || "Your Name"}</Text>
            <Text style={styles.roleLabel}>ACTIVE VOLUNTEER</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Details</Text>

            <Text style={styles.fieldLabel}>FIRST NAME (READ ONLY)</Text>
            <Text style={styles.readOnlyValue}>{firstName || "—"}</Text>

            <Text style={styles.fieldLabel}>LAST NAME (READ ONLY)</Text>
            <Text style={styles.readOnlyValue}>{lastName || "—"}</Text>

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

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
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
  readOnlyValue: { fontSize: 15, color: COLORS.navy, fontWeight: "700" },
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
  input: { flex: 1, paddingVertical: 14, fontSize: 14, fontWeight: "600", color: COLORS.navy },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  contactText: { fontSize: 13, color: COLORS.black },
  logoutButton: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: COLORS.red,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: { color: COLORS.red, fontWeight: "800", fontSize: 15 },
});
