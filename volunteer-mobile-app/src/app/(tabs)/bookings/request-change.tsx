import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import KeyboardAvoidingScreen from "../../../components/KeyboardAvoidingScreen";
import { DateBadge } from "../../../components/ShiftCardParts";
import { SHEET_TOP_SHADOW } from "../../../constants/glassCard";
import { getTabBarStyle } from "../../../constants/tabBar";
import { submitChangeRequest } from "../../../services/changeRequests";
import { getErrorMessage } from "../../../utils/api";
import { COLORS } from "../../../utils/colors";
import { getRelativeLabel } from "../../../utils/dateBuckets";
import { logError } from "../../../utils/logError";
import { formatTimeSlotLabel, hasShiftEnded } from "../../../utils/timeSlot";
import { showErrorToast } from "../../../utils/toast";

export default function RequestChangeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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

  // Same as Submit Availability: the floating tab bar would otherwise sit over the
  // bottom of the form (and the submit button while the keyboard is open).
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      parent?.setOptions({ tabBarStyle: getTabBarStyle(insets.bottom) });
    };
  }, [navigation, insets.bottom]);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Reason required", "Please tell us why you'd like to cancel this shift.");
      return;
    }
    if (!hasShift || ended) return;
    setSubmitting(true);
    try {
      await submitChangeRequest({ rosterAssignmentId, reason: reason.trim() });
      Alert.alert(
        "Request Submitted",
        "Your cancellation request has been submitted and is pending review. You're still assigned to this shift until it's approved.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      logError("Request change error", error);
      showErrorToast("Couldn't submit", getErrorMessage(error, "Something went wrong. Try again in a moment."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingScreen style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[COLORS.redLight, COLORS.redDark]}
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
            <Path d="M-20,46 C40,38 90,52 140,44 C190,36 240,50 290,42 C330,36 380,46 420,40 L420,260 L-20,260 Z" fill={COLORS.redAccentLight} opacity={0.04} />
            <Path d="M-20,68 C40,58 90,74 140,64 C190,54 240,70 290,60 C330,54 380,66 420,58 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.05} />
            <Path d="M-20,90 C40,82 90,96 140,86 C190,76 240,92 290,82 C330,76 380,88 420,80 L420,260 L-20,260 Z" fill={COLORS.redAccentLight} opacity={0.07} />
            <Path d="M-20,112 C40,102 90,118 140,108 C190,98 240,114 290,104 C330,98 380,110 420,102 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.08} />
            <Path d="M-20,134 C40,126 90,140 140,130 C190,120 240,136 290,126 C330,120 380,132 420,124 L420,260 L-20,260 Z" fill={COLORS.redAccentLight} opacity={0.09} />
            <Path d="M-20,156 C40,146 90,162 140,152 C190,142 240,158 290,148 C330,142 380,154 420,146 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.11} />
            <Path d="M-20,178 C40,170 90,184 140,174 C190,164 240,180 290,170 C330,164 380,176 420,168 L420,260 L-20,260 Z" fill={COLORS.redAccentLight} opacity={0.12} />
            <Path d="M-20,200 C40,190 90,206 140,196 C190,186 240,202 290,192 C330,186 380,198 420,190 L420,260 L-20,260 Z" fill="#ffffff" opacity={0.14} />
            <Path d="M-20,222 C40,214 90,228 140,218 C190,208 240,224 290,214 C330,208 380,220 420,212 L420,260 L-20,260 Z" fill={COLORS.redAccentLight} opacity={0.16} />
          </Svg>

          <View style={styles.bannerTopRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleGroup}>
            <Text style={styles.title}>Request to Cancel</Text>
            <Text style={styles.subtitle}>CANCELLATION REQUEST</Text>
            <Text style={styles.tagline}>Let us know why you can&apos;t make this shift</Text>
          </View>
        </LinearGradient>

        <View style={styles.sheet}>
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
              <Text style={styles.emptyText}>It can no longer be cancelled.</Text>
            </View>
          ) : (
            <>
              <View style={styles.infoBannerWrap}>
                <View style={styles.infoBanner}>
                  <Ionicons name="alarm-outline" size={20} color={COLORS.redMid} />
                  <Text style={styles.infoText}>
                    This sends a cancellation request for review — it doesn&apos;t remove you from the shift right away. You stay assigned until it&apos;s approved.
                  </Text>
                </View>
                <Svg width={18} height={10} viewBox="0 0 18 10" style={styles.infoBannerTail}>
                  <Path d="M0,0 L18,0 L18,10 Z" fill={COLORS.redBg} />
                </Svg>
              </View>

              <Text style={styles.sectionLabel}>SHIFT TO CANCEL</Text>
              <View style={styles.shiftCard}>
                <DateBadge dateStr={params.shiftDate as string} size={56} color={COLORS.redMid} />
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftTitle}>{formatTimeSlotLabel(params.timeSlot ?? "")}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.grey} />
                    <Text style={styles.metaText}>{params.timeSlot}</Text>
                  </View>
                  {params.location ? (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={14} color={COLORS.grey} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {params.location}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.grey} />
                    <Text style={styles.metaText}>{getRelativeLabel(params.shiftDate as string)}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.sectionLabel}>REASON FOR CANCELLING</Text>
              <TextInput
                style={styles.reasonInput}
                multiline
                numberOfLines={4}
                placeholder="Let us know why you need to cancel this shift..."
                placeholderTextColor={COLORS.grey}
                value={reason}
                onChangeText={setReason}
                accessibilityLabel="Reason for cancelling"
              />

              <TouchableOpacity
                style={styles.submitButtonWrap}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <View style={styles.submitButton}>
                  {submitting ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.submitButtonText}>Cancel</Text>
                  )}
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  banner: {
    paddingBottom: 90,
  },
  bannerTopRow: {
    paddingHorizontal: 20,
    marginBottom: 14,
    zIndex: 1,
  },
  titleGroup: {
    paddingHorizontal: 20,
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
  subtitle: {
    fontSize: 13,
    color: COLORS.redAccentLight,
    letterSpacing: 1.5,
    marginLeft: 1.5,
    marginTop: 6,
    fontWeight: "700",
    zIndex: 1,
  },
  tagline: {
    fontSize: 11.5,
    color: "#f8d9d5",
    letterSpacing: 0.3,
    marginTop: 6,
    fontWeight: "500",
    zIndex: 1,
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 28,
    shadowColor: "#3d0a08",
    ...SHEET_TOP_SHADOW,
  },
  infoBannerWrap: {
    marginBottom: 24,
  },
  infoBanner: {
    backgroundColor: COLORS.redBg,
    flexDirection: "row",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 14,
    padding: 14,
    gap: 10,
  },
  infoBannerTail: {
    position: "absolute",
    bottom: -10,
    right: 0,
  },
  infoText: { flex: 1, fontSize: 12, color: "#7a2620", lineHeight: 17 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.redMid,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  shiftCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1.5,
    borderColor: "#ecdcda",
    borderRadius: 18,
    padding: 14,
    marginBottom: 22,
  },
  shiftInfo: { flex: 1, gap: 4 },
  shiftTitle: { fontSize: 16, fontWeight: "700", color: COLORS.redDark, marginBottom: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { flex: 1, fontSize: 13, color: COLORS.grey },
  reasonInput: {
    borderWidth: 1.5,
    borderColor: "#ecdcda",
    backgroundColor: "#fdf8f7",
    borderRadius: 16,
    padding: 14,
    minHeight: 110,
    textAlignVertical: "top",
    fontSize: 14,
    color: "#1b2a33",
  },
  submitButtonWrap: {
    marginTop: 24,
    borderRadius: 30,
    shadowColor: COLORS.redDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButton: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 30,
    backgroundColor: COLORS.redMid,
  },
  submitButtonText: { color: COLORS.white, fontWeight: "600", fontSize: 15.5, letterSpacing: 0.2 },
  emptyStateCard: {
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ecdcda",
    borderRadius: 18,
    padding: 26,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: COLORS.redDark },
  emptyText: { fontSize: 13, color: COLORS.grey, textAlign: "center" },
});
