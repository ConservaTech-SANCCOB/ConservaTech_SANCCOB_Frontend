import { useRef } from "react";
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { GLASS_CARD, GLASS_SHADOW_MD } from "../constants/glassCard";
import { MyShift } from "../services/shifts";
import { COLORS } from "../utils/colors";
import { getRelativeLabel } from "../utils/dateBuckets";
import { formatTimeSlotLabel, hasShiftEnded } from "../utils/timeSlot";
import { DateBadge } from "./ShiftCardParts";

export default function MyShiftCard({
  item,
  cancellationPending = false,
}: {
  item: MyShift;
  /** A pending cancellation request already exists for this shift — hides the cancel action. */
  cancellationPending?: boolean;
}) {
  const router = useRouter();
  const ended = hasShiftEnded(item.shiftDate, item.timeSlot);
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start();
  };

  const requestChange = () => {
    router.push({
      pathname: "/(tabs)/bookings/request-change",
      params: {
        bookingId: String(item.rosterAssignmentId),
        shiftDate: item.shiftDate,
        timeSlot: item.timeSlot,
        location: item.location ?? "",
        status: item.status,
      },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() =>
        Alert.alert(
          `${formatTimeSlotLabel(item.timeSlot)} shift`,
          `${item.shiftDate}${item.location ? ` · ${item.location}` : ""}\nStatus: ${item.status}${
            cancellationPending ? "\nCancellation request pending review" : ""
          }`,
          ended || cancellationPending
            ? [{ text: "Close", style: "cancel" }]
            : [
                { text: "Close", style: "cancel" },
                { text: "Request to Cancel", onPress: requestChange },
              ]
        )
      }
    >
      <Animated.View style={[styles.shiftCard, { transform: [{ scale }] }]}>
        <View style={[styles.notch, styles.notchTopRight]} />
        <View style={[styles.notch, styles.notchBottomLeft]} />
        <View style={styles.titleRow}>
          <Text style={styles.shiftTimeLabel}>{formatTimeSlotLabel(item.timeSlot)}</Text>
          {!ended && cancellationPending && (
            <View style={styles.pendingDot} accessible accessibilityLabel="Cancellation pending" />
          )}
        </View>
        <View style={styles.badgeRow}>
          <DateBadge dateStr={item.shiftDate} size={56} />
          <View style={styles.metaColumn}>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.grey} />
              <Text style={styles.metaText}>{item.timeSlot}</Text>
            </View>
            {item.location && (
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color={COLORS.grey} />
                <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
                  {item.location}
                </Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.grey} />
              <Text style={styles.metaText}>{getRelativeLabel(item.shiftDate)}</Text>
            </View>
          </View>
        </View>
        {!ended && <View style={styles.divider} />}
        {!ended && !cancellationPending && (
          <TouchableOpacity style={styles.changeButtonWrap} onPress={requestChange} hitSlop={6}>
            <LinearGradient
              colors={["#FF6B6B", "#C62828"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.changeButton}
            >
              <Ionicons name="close-circle-outline" size={13} color={COLORS.white} />
              <Text style={styles.changeButtonText}>Request to Cancel</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  shiftCard: {
    ...GLASS_CARD,
    ...GLASS_SHADOW_MD,
    backgroundColor: COLORS.white,
    borderColor: COLORS.navy,
    borderTopColor: COLORS.navy,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  notch: {
    position: "absolute",
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: COLORS.lightGrey,
    borderWidth: 0.75,
    borderColor: COLORS.navy,
  },
  notchTopRight: { top: 8, right: 8 },
  notchBottomLeft: { bottom: 8, left: 8 },
  shiftTimeLabel: { fontSize: 17, fontWeight: "800", color: COLORS.navy },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  metaColumn: { flex: 1, gap: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { flexShrink: 1, fontSize: 13, color: COLORS.grey, fontWeight: "600" },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,46,76,0.12)",
    marginTop: 6,
    marginLeft: 70,
  },
  changeButtonWrap: {
    alignSelf: "flex-end",
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 0.75,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#002e4c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 13.5,
  },
  changeButtonText: { fontSize: 11, fontWeight: "800", color: COLORS.white },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  // Same 8px round dot as the unread indicator in notifications.tsx, in amber for "pending".
  pendingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.amber },
});
