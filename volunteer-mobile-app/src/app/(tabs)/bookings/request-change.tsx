import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ImageBackground, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../../utils/colors";
import { GLASS_CARD, GLASS_SHADOW_LG } from "../../../constants/glassCard";
import { submitChangeRequest } from "../../../services/changeRequests";
import { parseLocalDate } from "../../../utils/dateBuckets";
import { formatTimeSlotLabel, hasShiftEnded } from "../../../utils/timeSlot";

export default function RequestChangeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    bookingId?: string;
    shiftDate?: string;
    timeSlot?: string;
    location?: string;
    status?: string;
  }>();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const rosterAssignmentId = params.bookingId ? Number(params.bookingId) : NaN;
  const hasShift = Boolean(params.bookingId) && Number.isFinite(rosterAssignmentId) && Boolean(params.shiftDate);
  const ended = hasShift && hasShiftEnded(params.shiftDate as string, params.timeSlot ?? "");
  const displayDate = params.shiftDate
    ? parseLocalDate(params.shiftDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Reason required", "Please tell us why you'd like to change this booking.");
      return;
    }
    if (!hasShift || ended) return;
    setSubmitting(true);
    try {
      await submitChangeRequest({ rosterAssignmentId, reason: reason.trim() });
      Alert.alert(
        "Request Submitted",
        "Your request has been sent for review. Your original assignment stays active until it's reviewed.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Request change error:", error);
      Alert.alert("Couldn't submit", "Something went wrong, try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../../../assets/images/bg_kelpGull.jpg.jpeg")}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.86)", "rgba(255,255,255,0.76)", "rgba(255,255,255,0.84)"]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 40 }}>
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={22} color={COLORS.navy} />
            </TouchableOpacity>
            <View style={styles.titleCard}>
              <Text style={styles.headerTitle}>Request Change</Text>
            </View>
          </View>

          {!hasShift ? (
            <View style={styles.emptyStateCard}>
              <Ionicons name="alert-circle-outline" size={32} color={COLORS.grey} />
              <Text style={styles.emptyTitle}>We couldn&apos;t find that shift</Text>
              <Text style={styles.emptyText}>Go back and try again.</Text>
            </View>
          ) : ended ? (
            <View style={styles.emptyStateCard}>
              <Ionicons name="time-outline" size={32} color={COLORS.grey} />
              <Text style={styles.emptyTitle}>This shift has already ended</Text>
              <Text style={styles.emptyText}>It can no longer be changed.</Text>
            </View>
          ) : (
            <>
              <View style={styles.warningBanner}>
                <Ionicons name="alarm-outline" size={20} color={COLORS.amber} />
                <Text style={styles.warningText}>
                  Your original shift stays active until your request is reviewed.
                </Text>
              </View>

              <Text style={styles.sectionLabel}>Shift to Change</Text>

              <View style={styles.bookingCard}>
                <View style={styles.bookingHeaderRow}>
                  <Text style={styles.bookingDate}>{displayDate}</Text>
                </View>
                <Text style={styles.bookingDetail}>
                  Time Slot: {formatTimeSlotLabel(params.timeSlot ?? "")}
                </Text>
                {params.location ? (
                  <Text style={styles.bookingLocation}>Location: {params.location}</Text>
                ) : null}

                <Text style={styles.reasonLabel}>Reason for change request</Text>
                <TextInput
                  style={styles.reasonInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Let us know why you need this changed..."
                  placeholderTextColor={COLORS.grey}
                  value={reason}
                  onChangeText={setReason}
                />

                <TouchableOpacity style={styles.submitButtonWrap} onPress={handleSubmit} disabled={submitting}>
                  <LinearGradient
                    colors={["#6FD0FF", "#2BA8E0"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.submitButton}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="swap-horizontal-outline" size={16} color={COLORS.white} />
                        <Text style={styles.submitButtonText}>Submit Request</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  titleCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: COLORS.navy },
  warningBanner: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    flexDirection: "row",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  warningText: { flex: 1, fontSize: 13, color: COLORS.navy, lineHeight: 18 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: COLORS.navy, marginBottom: 10 },
  bookingCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    borderRadius: 16,
    padding: 16,
  },
  bookingHeaderRow: { flexDirection: "row", alignItems: "center" },
  bookingDate: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  bookingDetail: { fontSize: 14, color: COLORS.black, marginTop: 10 },
  bookingLocation: { fontSize: 13, color: COLORS.grey, marginTop: 2 },
  reasonLabel: { fontSize: 13, fontWeight: "700", color: COLORS.navy, marginTop: 16, marginBottom: 8 },
  reasonInput: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 14,
    padding: 12,
    minHeight: 90,
    textAlignVertical: "top",
    fontSize: 14,
    color: COLORS.navy,
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonWrap: {
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
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15.25,
    paddingVertical: 14,
  },
  submitButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 15 },
  emptyStateCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_LG,
    alignItems: "center",
    borderRadius: 18,
    padding: 26,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: COLORS.navy },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center" },
});
