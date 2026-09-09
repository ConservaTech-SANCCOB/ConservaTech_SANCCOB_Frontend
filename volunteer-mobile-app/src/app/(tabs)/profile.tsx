import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clearToken } from "../../utils/api";
import { COLORS } from "../../utils/colors";

export default function ProfileScreen() {
  const router = useRouter();
  const [fullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

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

  return (
    <ImageBackground
      source={require("../../../assets/images/bg_penguin.jpg.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.headerSection}>
            <Text style={styles.name}>{fullName || "Your Name"}</Text>
            <Text style={styles.roleLabel}>ACTIVE VOLUNTEER</Text>
          </View>

          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Personal Details</Text>
              <Text style={styles.fieldLabel}>FULL NAME (READ ONLY)</Text>
              <Text style={styles.readOnlyValue}>{fullName || "—"}</Text>
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
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Change Password</Text>
              <TextInput
                style={styles.plainInput}
                placeholder="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
              <TextInput
                style={[styles.plainInput, { marginTop: 10 }]}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.75)" },
  container: { flex: 1 },
  headerSection: { alignItems: "center", paddingVertical: 30 },
  name: { fontSize: 20, fontWeight: "800", color: COLORS.navy },
  roleLabel: { fontSize: 11, color: COLORS.navy, fontWeight: "700", letterSpacing: 1, marginTop: 4, opacity: 0.8 },
  content: { padding: 20 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: COLORS.navy, marginBottom: 12 },
  fieldLabel: { fontSize: 10, color: COLORS.grey, fontWeight: "700", marginTop: 10, marginBottom: 4 },
  readOnlyValue: { fontSize: 15, color: COLORS.navy, fontWeight: "700" },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D8DCDF", backgroundColor: COLORS.lightGrey, borderRadius: 8, paddingHorizontal: 10 },
  input: { flex: 1, paddingVertical: 10, fontSize: 14 },
  plainInput: { borderWidth: 1, borderColor: "#D8DCDF", backgroundColor: COLORS.lightGrey, borderRadius: 8, padding: 10, fontSize: 14 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  contactText: { fontSize: 13, color: COLORS.black },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: COLORS.red, borderRadius: 12, paddingVertical: 14, gap: 8 },
  logoutText: { color: COLORS.red, fontWeight: "800", fontSize: 15 },
});