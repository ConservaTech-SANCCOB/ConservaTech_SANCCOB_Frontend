import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../../utils/colors";
import { mockBookings } from "../../../data/mockBookings";
import StatusBadge from "../../../components/StatusBadge";

export default function RequestChangeScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const [reason, setReason] = useState("");

  const booking =
    mockBookings.find((b) => b.id === bookingId) ||
    mockBookings.find((b) => b.status !== "Cancelled");

  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert("Reason required", "Please tell us why you'd like to change this booking.");
      return;
    }
    Alert.alert(
      "Request Submitted",
      "Your booking change request has been sent for approval. Your original booking stays active until it's reviewed.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20 }}>No booking found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Change</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.warningBanner}>
          <Ionicons name="alarm-outline" size={20} color={COLORS.amber} />
          <Text style={styles.warningText}>Your original booking stays active until your request is reviewed.</Text>
        </View>

        <Text style={styles.sectionLabel}>Select Booking to Change</Text>

        <View style={styles.bookingCard}>
          <View style={styles.bookingHeaderRow}>
            <Text style={styles.bookingDate}>{booking.date}</Text>
            <StatusBadge status="Pending Approval" />
          </View>
          <Text style={styles.bookingDetail}>Time Slot: {booking.timeSlot}</Text>
          <Text style={styles.bookingTask}>Task: {booking.assignedTask}</Text>

          <Text style={styles.reasonLabel}>Reason for change request</Text>
          <TextInput
            style={styles.reasonInput}
            multiline
            numberOfLines={4}
            placeholder="Let us know why you need this booking changed..."
            value={reason}
            onChangeText={setReason}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F0F2F5" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.navy },
  warningBanner: { flexDirection: "row", backgroundColor: "#FFF4D9", borderRadius: 10, padding: 12, gap: 10, marginBottom: 20 },
  warningText: { flex: 1, fontSize: 13, color: COLORS.navy, lineHeight: 18 },
  sectionLabel: { fontSize: 16, fontWeight: "700", color: COLORS.navy, marginBottom: 10 },
  bookingCard: { borderWidth: 1, borderColor: "#E2E5E8", borderRadius: 12, padding: 16 },
  bookingHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bookingDate: { fontSize: 16, fontWeight: "700", color: COLORS.navy },
  bookingDetail: { fontSize: 14, color: COLORS.black, marginTop: 10 },
  bookingTask: { fontSize: 13, color: COLORS.grey, marginTop: 2 },
  reasonLabel: { fontSize: 14, fontWeight: "600", color: COLORS.navy, marginTop: 16, marginBottom: 8 },
  reasonInput: { borderWidth: 1, borderColor: "#D8DCDF", backgroundColor: "#F5F7F8", borderRadius: 8, padding: 12, minHeight: 90, textAlignVertical: "top" },
  submitButton: { backgroundColor: COLORS.navy, borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  submitButtonText: { color: COLORS.white, fontWeight: "700", fontSize: 15 },
});