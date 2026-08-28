import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../utils/colors";

const mockDocuments = [
  { id: "d1", name: "ID_Document_Sarah.pdf" },
  { id: "d2", name: "Volunteer_Agreement_SANCCOB.pdf" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("sarah.volunteer@gmail.com");
  const [phone, setPhone] = useState("+27 82 456 7890");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => router.replace("/") },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={COLORS.white} />
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={12} color={COLORS.white} />
            </View>
          </View>
          <Text style={styles.name}>Sarah Jenkins</Text>
          <Text style={styles.roleLabel}>ACTIVE VOLUNTEER</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Details</Text>

            <Text style={styles.fieldLabel}>FULL NAME (READ ONLY)</Text>
            <Text style={styles.readOnlyValue}>Sarah Jenkins</Text>

            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" />

            <Text style={styles.fieldLabel}>MOBILE PHONE</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submitted Documents</Text>
            {mockDocuments.map((doc) => (
              <View key={doc.id} style={styles.documentRow}>
                <Ionicons name="document-text-outline" size={18} color={COLORS.blue} />
                <Text style={styles.documentName}>{doc.name}</Text>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
              </View>
            ))}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  headerSection: { alignItems: "center", backgroundColor: "#F5F7F8", paddingVertical: 30 },
  avatarWrapper: { position: "relative" },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.blue, alignItems: "center", justifyContent: "center" },
  editBadge: { position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.blue, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: COLORS.white },
  name: { fontSize: 18, fontWeight: "700", color: COLORS.navy, marginTop: 12 },
  roleLabel: { fontSize: 11, color: COLORS.grey, letterSpacing: 1, marginTop: 2 },
  content: { padding: 20 },
  card: { borderWidth: 1, borderColor: "#E2E5E8", borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.navy, marginBottom: 12 },
  fieldLabel: { fontSize: 10, color: COLORS.grey, fontWeight: "600", marginTop: 10, marginBottom: 4 },
  readOnlyValue: { fontSize: 15, color: COLORS.navy, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#D8DCDF", backgroundColor: "#F5F7F8", borderRadius: 8, padding: 10, fontSize: 14 },
  documentRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  documentName: { flex: 1, fontSize: 13, color: COLORS.black },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  contactText: { fontSize: 13, color: COLORS.black },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.red, borderRadius: 10, paddingVertical: 14, gap: 8 },
  logoutText: { color: COLORS.red, fontWeight: "700", fontSize: 15 },
});