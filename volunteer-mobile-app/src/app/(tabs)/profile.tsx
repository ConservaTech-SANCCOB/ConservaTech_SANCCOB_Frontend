import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
              <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="you@example.com" />
              <Ionicons name="pencil" size={16} color={COLORS.blue} />
            </View>

            <Text style={styles.fieldLabel}>MOBILE PHONE</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+27 00 000 0000" />
              <Ionicons name="pencil" size={16} color={COLORS.blue} />
            </View>

            <Text style={styles.fieldLabel}>NATIONALITY</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} value={nationality} onChangeText={setNationality} placeholder="South African" />
              <Ionicons name="pencil" size={16} color={COLORS.blue} />
            </View>

            <Text style={styles.fieldLabel}>AGE BRACKET</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} value={ageBracket} onChangeText={setAgeBracket} placeholder="18-25" />
              <Ionicons name="pencil" size={16} color={COLORS.blue} />
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
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 22,
    paddingVertical: 20,
    marginBottom: 20,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  name: { fontSize: 18, fontWeight: "800", color: COLORS.navy },
  roleLabel: { fontSize: 11, color: "#3f5f75", fontWeight: "700", letterSpacing: 1, marginTop: 4 },
  card: {
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.navy, marginBottom: 12 },
  fieldLabel: { fontSize: 10, color: COLORS.grey, fontWeight: "700", marginTop: 10, marginBottom: 4 },
  readOnlyValue: { fontSize: 15, color: COLORS.navy, fontWeight: "700" },
  inputRow: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1.5,
  borderColor: "rgba(0,46,76,0.35)",
  backgroundColor: "rgba(255,255,255,0.7)",
  borderRadius: 8,
  paddingHorizontal: 10,
},
  input: { flex: 1, paddingVertical: 10, fontSize: 14 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  contactText: { fontSize: 13, color: COLORS.black },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1.5,
    borderColor: COLORS.red,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoutText: { color: COLORS.red, fontWeight: "800", fontSize: 15 },
});